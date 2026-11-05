import {
  getOrderById,
  listOrdersWithCourier,
  setOrderCourier,
  updateOrderStatus,
} from "../models/Order.js";
import { COURIER_FINAL_STATUSES, isCourierActive } from "../data/courierStatuses.js";
import { notifyCustomerOrderStatus } from "../utils/pushNotifications.js";
import {
  isCourierEnabled,
  createClaim,
  getClaim,
  acceptClaim,
  getClaimCancelInfo,
  cancelClaim,
} from "../utils/yandexDelivery.js";
import { logger } from "../utils/logger.js";

const SYNC_INTERVAL_MS = 10000;
const PICKED_UP = ["pickuped", "delivery_arrived", "ready_for_delivery_confirmation"];
const DELIVERED = ["delivered", "delivered_finish"];

async function moveOrderTo(order, status) {
  const updated = await updateOrderStatus(order.id, status);
  notifyCustomerOrderStatus(updated);
}

/** Yandex'dagi zayavka holatini buyurtmaga qo'llaydi. */
export async function syncCourier(order) {
  const claim = await getClaim(order.courierClaimId);
  let courierStatus = claim.status;

  // Narx baholangach zayavka tasdiqlanadi — shundan keyin kuryer qidiriladi.
  if (claim.status === "ready_for_approval") {
    const accepted = await acceptClaim(claim.id, claim.version);
    courierStatus = accepted.status;
  }

  await setOrderCourier(order.id, {
    courierStatus,
    courierName: claim.performer_info?.courier_name ?? order.courierName,
  });

  if (order.status === "CANCELLED") return;
  if (DELIVERED.includes(claim.status)) {
    if (order.status !== "DELIVERED") await moveOrderTo(order, "DELIVERED");
  } else if (
    PICKED_UP.includes(claim.status) &&
    !["OUT_FOR_DELIVERY", "DELIVERED"].includes(order.status)
  ) {
    await moveOrderTo(order, "OUT_FOR_DELIVERY");
  }
}

export async function syncAllCouriers() {
  const orders = await listOrdersWithCourier(COURIER_FINAL_STATUSES);
  for (const order of orders) {
    try {
      await syncCourier(order);
    } catch (error) {
      logger.error(`Buyurtma #${order.id} kuryer holatini olishda xatolik:`, error);
    }
  }
}

export function startCourierSync() {
  if (!isCourierEnabled()) return;
  setInterval(() => {
    syncAllCouriers().catch((error) => logger.error("Kuryer holatlarini olishda xatolik:", error));
  }, SYNC_INTERVAL_MS).unref();
}

/** POST /api/admin/orders/:id/courier — Yandex kuryerini chaqirish. */
export async function requestCourierHandler(req, res) {
  if (!isCourierEnabled()) {
    return res.status(400).json({ error: "Kuryer sozlanmagan", code: "COURIER_DISABLED" });
  }

  try {
    const order = await getOrderById(Number(req.params.id));
    if (!order) return res.status(404).json({ error: "Buyurtma topilmadi" });

    if (
      order.orderType !== "DELIVERY" ||
      order.paymentStatus !== "PAID" ||
      !["CONFIRMED", "READY"].includes(order.status)
    ) {
      return res.status(409).json({ error: "Kuryer chaqirib bo'lmaydi", code: "COURIER_NOT_ALLOWED" });
    }
    if (isCourierActive(order)) {
      return res.status(409).json({ error: "Kuryer allaqachon chaqirilgan", code: "COURIER_ACTIVE" });
    }

    const claim = await createClaim(order);
    const updated = await setOrderCourier(order.id, {
      courierClaimId: claim.id,
      courierStatus: claim.status,
      courierName: null,
    });
    const { trackingToken, paymentUrl, ...view } = updated;
    res.status(201).json({ order: view });
  } catch (error) {
    logger.error("Kuryer chaqirishda xatolik:", error);
    res.status(502).json({ error: "Kuryer chaqirilmadi", code: "COURIER_FAILED" });
  }
}

/**
 * POST /api/admin/orders/:id/courier/cancel  Body: { allowPaid? }
 * Kuryer kelib bo'lgach bekor qilish pullik — admin buni tasdiqlashi kerak.
 */
export async function cancelCourierHandler(req, res) {
  try {
    const order = await getOrderById(Number(req.params.id));
    if (!order) return res.status(404).json({ error: "Buyurtma topilmadi" });
    if (!isCourierActive(order)) {
      return res.status(409).json({ error: "Faol kuryer yo'q", code: "COURIER_NOT_ACTIVE" });
    }

    const info = await getClaimCancelInfo(order.courierClaimId);
    if (info.cancel_state === "unavailable") {
      return res.status(409).json({ error: "Bekor qilib bo'lmaydi", code: "CANCEL_UNAVAILABLE" });
    }
    if (info.cancel_state === "paid" && req.body?.allowPaid !== true) {
      return res.status(409).json({ error: "Pullik", code: "CANCEL_PAID", price: info.price });
    }

    const claim = await getClaim(order.courierClaimId);
    const cancelled = await cancelClaim(claim.id, claim.version, info.cancel_state);
    const updated = await setOrderCourier(order.id, { courierStatus: cancelled.status });
    const { trackingToken, paymentUrl, ...view } = updated;
    res.json({ order: view });
  } catch (error) {
    logger.error("Kuryerni bekor qilishda xatolik:", error);
    res.status(502).json({ error: "Bekor qilinmadi", code: "COURIER_CANCEL_FAILED" });
  }
}
