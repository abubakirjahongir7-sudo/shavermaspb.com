import crypto from "node:crypto";
import {
  createOrder,
  listOrders,
  getOrderById,
  updateOrderStatus,
  setOrderPayment,
} from "../models/Order.js";
import { listStoppedItemIds } from "../models/StoppedItem.js";
import { saveCustomerPushSubscription } from "../models/CustomerPushSubscription.js";
import { CAFES, findCafe } from "../data/cafes.js";
import { DELIVERY_CONFIG } from "../data/delivery.js";
import { isCourierActive } from "../data/courierStatuses.js";
import { isCourierEnabled } from "../utils/yandexDelivery.js";
import { findMenuItem } from "../data/menuItems.js";
import { broadcastNewOrder } from "../core/sseClients.js";
import { safeEqual } from "../middlewares/adminAuth.middleware.js";
import {
  notifyAdminDevicesNewOrder,
  notifyCustomerOrderStatus,
} from "../utils/pushNotifications.js";
import { quoteDelivery } from "../utils/delivery.js";
import {
  isCardPaymentEnabled,
  createPayment,
  getPayment,
  createRefund,
} from "../utils/yookassa.js";
import { applyPayment } from "./paymentController.js";
import { logger } from "../utils/logger.js";

const VALID_STATUSES = ["PENDING", "CONFIRMED", "READY", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];
const VALID_ORDER_TYPES = ["PICKUP", "DELIVERY"];
const VALID_PAYMENT_METHODS = ["CASH", "CARD"];
const PHONE_PATTERN = /^\+?[\d\s()-]{7,20}$/;

function withoutToken({ trackingToken, paymentUrl, ...order }) {
  return order;
}

/** Mijozga ko'rinadigan buyurtma ma'lumoti — telefon/kuzatuv tokenisiz. */
function toCustomerView(order) {
  return {
    id: order.id,
    status: order.status,
    orderType: order.orderType,
    cafeId: order.cafeId,
    address: order.address,
    items: order.items,
    total: order.total,
    deliveryFee: order.deliveryFee,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    paymentUrl: order.paymentStatus === "PENDING" ? order.paymentUrl : undefined,
    customerName: order.customerName,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

/**
 * id + token bo'yicha buyurtmani topadi. Token noto'g'ri bo'lsa ham
 * "topilmadi" qaytariladi — boshqa buyurtmalar mavjudligini oshkor qilmaslik uchun.
 */
async function findTrackedOrder(idParam, token) {
  const id = Number(idParam);
  if (!Number.isInteger(id) || typeof token !== "string" || !token) return null;
  const order = await getOrderById(id);
  if (!order || !safeEqual(token, order.trackingToken)) return null;
  return order;
}

/**
 * POST /api/orders — PWA'dan kelgan yangi buyurtma.
 * Body: { items: [{id, quantity, comment?}], total, orderType, cafeId?, address?,
 *         latitude?, longitude?, customerName, phone, paymentMethod? }
 */
export async function createOrderHandler(req, res) {
  const {
    items,
    total,
    orderType,
    cafeId,
    address,
    latitude,
    longitude,
    customerName,
    phone,
    paymentMethod,
  } = req.body ?? {};

  if (!Array.isArray(items) || !items.length || typeof total !== "number") {
    return res.status(400).json({ error: "items va total majburiy" });
  }

  const name = typeof customerName === "string" ? customerName.trim().slice(0, 60) : "";
  const phoneValue = typeof phone === "string" ? phone.trim() : "";
  if (!name || !PHONE_PATTERN.test(phoneValue) || phoneValue.replace(/\D/g, "").length < 7) {
    return res.status(400).json({ error: "Ism va telefon raqami majburiy" });
  }

  const type = orderType ?? "PICKUP";
  if (!VALID_ORDER_TYPES.includes(type)) {
    return res.status(400).json({ error: "Noto'g'ri orderType" });
  }
  if (type === "PICKUP" && (!cafeId || !findCafe(cafeId))) {
    return res.status(400).json({ error: "Noto'g'ri cafeId" });
  }
  if (type === "DELIVERY" && !address?.trim()) {
    return res.status(400).json({ error: "Yetkazib berish uchun address majburiy" });
  }

  const method = paymentMethod ?? "CASH";
  if (!VALID_PAYMENT_METHODS.includes(method)) {
    return res.status(400).json({ error: "Noto'g'ri paymentMethod" });
  }
  if (method === "CARD" && !isCardPaymentEnabled()) {
    return res.status(400).json({ error: "Karta bilan to'lov o'chiq", code: "CARD_DISABLED" });
  }

  // Kafening o'z kuryeri yo'q, Yandex kuryeri esa naqd pul olmaydi — yetkazib
  // berish faqat oldindan karta bilan to'lanadi.
  if (type === "DELIVERY") {
    if (!isCardPaymentEnabled() || !isCourierEnabled()) {
      return res.status(400).json({ error: "Yetkazib berish o'chiq", code: "DELIVERY_DISABLED" });
    }
    if (method !== "CARD") {
      return res.status(400).json({ error: "Faqat karta bilan", code: "DELIVERY_REQUIRES_CARD" });
    }
  }

  // Yetkazib berish buyurtmasini ham hozircha yagona filial tayyorlaydi.
  const orderCafeId = type === "PICKUP" ? cafeId : CAFES[0].id;

  try {
    // Mijoz savatga qo'shgandan keyin, u tayyorlanguncha kafe egasi shu
    // mahsulotni shu filialda stopga qo'yib ulgurgan bo'lishi mumkin —
    // shuning uchun frontend tekshiruviga qo'shimcha, bu yerda ham qayta
    // tekshiramiz. Har bir filial alohida stop-listga ega.
    const stoppedIds = await listStoppedItemIds(orderCafeId);
    const stoppedInOrder = items.filter((item) => stoppedIds.includes(item?.id));
    if (stoppedInOrder.length) {
      return res.status(400).json({
        error: "Ba'zi mahsulotlar hozir mavjud emas",
        stoppedItemIds: stoppedInOrder.map((item) => item.id),
      });
    }

    // Mijoz yuborgan nom/narxga ISHONMAYMIZ — har bir mahsulotni
    // `menuItems.js`dagi haqiqiy narx bilan almashtiramiz va `total`ni
    // shulardan qayta hisoblaymiz.
    let recomputedTotal = 0;
    const sanitizedItems = [];
    for (const item of items) {
      const menuItem = findMenuItem(item?.id);
      if (!menuItem) {
        return res.status(400).json({ error: `Noto'g'ri mahsulot: ${item?.id}` });
      }

      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
        return res.status(400).json({ error: `Noto'g'ri miqdor: ${item.id}` });
      }

      const comment = typeof item.comment === "string" ? item.comment.trim().slice(0, 200) : "";
      recomputedTotal += menuItem.price * quantity;
      sanitizedItems.push({
        id: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity,
        ...(comment ? { comment } : {}),
      });
    }

    // Yetkazib berish narxi ham serverda qayta hisoblanadi.
    let deliveryFee = 0;
    let deliveryCoords = {};
    if (type === "DELIVERY") {
      if (recomputedTotal < DELIVERY_CONFIG.minOrder) {
        return res.status(400).json({
          error: "Eng kam buyurtma summasiga yetmadi",
          code: "MIN_ORDER",
          minOrder: DELIVERY_CONFIG.minOrder,
        });
      }
      const quote = await quoteDelivery({ address: address.trim(), latitude, longitude });
      if (!quote.available) {
        return res.status(400).json({ error: "Bu manzilga yetkazib bo'lmaydi", code: quote.reason });
      }
      deliveryFee = quote.fee;
      deliveryCoords = { latitude: quote.lat, longitude: quote.lng };
    }

    let order = await createOrder({
      customerName: name,
      phone: phoneValue,
      trackingToken: crypto.randomBytes(24).toString("base64url"),
      items: sanitizedItems,
      total: recomputedTotal + deliveryFee,
      deliveryFee,
      paymentMethod: method,
      paymentStatus: method === "CARD" ? "PENDING" : "NOT_REQUIRED",
      orderType: type,
      cafeId: orderCafeId,
      address: type === "DELIVERY" ? address.trim() : undefined,
      ...deliveryCoords,
    });

    if (method === "CARD") {
      // Oshxona buyurtmani to'lov tasdiqlangandan keyin ko'radi (paymentController).
      try {
        const payment = await createPayment(order);
        order = await setOrderPayment(order.id, {
          paymentId: payment.id,
          paymentUrl: payment.confirmation?.confirmation_url,
        });
      } catch (error) {
        logger.error("To'lov yaratishda xatolik:", error);
        await setOrderPayment(order.id, { paymentStatus: "CANCELED", status: "CANCELLED" });
        return res.status(502).json({ error: "To'lov yaratilmadi", code: "PAYMENT_FAILED" });
      }
    } else {
      broadcastNewOrder(order);
      notifyAdminDevicesNewOrder(order);
    }

    res.status(201).json({
      ok: true,
      orderId: order.id,
      trackingToken: order.trackingToken,
      customerName: order.customerName,
      paymentUrl: order.paymentUrl ?? undefined,
    });
  } catch (error) {
    logger.error("Buyurtma yaratishda xatolik (API):", error);
    res.status(500).json({ error: "Ichki xatolik" });
  }
}

/** GET /api/orders/:id?t=<trackingToken> — mijoz o'z buyurtmasi holatini ko'radi. */
export async function getTrackedOrderHandler(req, res) {
  try {
    let order = await findTrackedOrder(req.params.id, req.query.t);
    if (!order) return res.status(404).json({ error: "Buyurtma topilmadi" });

    // Mijoz to'lovdan qaytganda webhook hali kelmagan bo'lishi mumkin.
    if (order.paymentStatus === "PENDING" && order.paymentId) {
      try {
        order = await applyPayment(order, await getPayment(order.paymentId));
      } catch (error) {
        logger.error("To'lov holatini tekshirishda xatolik:", error);
      }
    }

    res.json({ order: toCustomerView(order) });
  } catch (error) {
    logger.error("Buyurtma holatini olishda xatolik:", error);
    res.status(500).json({ error: "Ichki xatolik" });
  }
}

/**
 * POST /api/orders/:id/push
 * Body: { token, subscription: { endpoint, keys: { p256dh, auth } } }
 * Mijoz qurilmasini shu buyurtma holati bildirishnomalariga obuna qiladi.
 */
export async function subscribeOrderPushHandler(req, res) {
  const { token, subscription } = req.body ?? {};
  const endpoint = subscription?.endpoint;
  const p256dh = subscription?.keys?.p256dh;
  const auth = subscription?.keys?.auth;

  if (typeof endpoint !== "string" || !endpoint.startsWith("https://") || !p256dh || !auth) {
    return res.status(400).json({ error: "Noto'g'ri subscription" });
  }

  try {
    const order = await findTrackedOrder(req.params.id, token);
    if (!order) return res.status(404).json({ error: "Buyurtma topilmadi" });

    await saveCustomerPushSubscription({ orderId: order.id, endpoint, p256dh, auth });
    res.status(201).json({ ok: true });
  } catch (error) {
    logger.error("Mijoz push obunasini saqlashda xatolik:", error);
    res.status(500).json({ error: "Ichki xatolik" });
  }
}

/** GET /api/admin/orders */
export async function listOrdersHandler(req, res) {
  try {
    const orders = await listOrders();
    res.json({ orders: orders.map(withoutToken) });
  } catch (error) {
    logger.error("Buyurtmalarni olishda xatolik:", error);
    res.status(500).json({ error: "Ichki xatolik" });
  }
}

/** PATCH /api/admin/orders/:id  Body: { status } */
export async function updateOrderStatusHandler(req, res) {
  const id = Number(req.params.id);
  const { status } = req.body ?? {};

  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Noto'g'ri id" });
  }
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: "Noto'g'ri status" });
  }

  try {
    const current = await getOrderById(id);
    if (!current) return res.status(404).json({ error: "Buyurtma topilmadi" });

    // Avval kuryer bekor qilinadi, aks holda pul qaytib, taom yo'lda qoladi.
    if (status === "CANCELLED" && isCourierActive(current)) {
      return res.status(409).json({ error: "Kuryer yo'lda", code: "COURIER_ACTIVE" });
    }

    // Puli qaytarilgan buyurtmani qayta ochib bo'lmaydi.
    if (current.paymentStatus === "REFUNDED" && status !== "CANCELLED") {
      return res.status(409).json({ error: "Pul qaytarilgan", code: "ALREADY_REFUNDED" });
    }

    // To'langan buyurtma bekor qilinsa, pul mijozga qaytariladi. Qaytarilmasa
    // buyurtma ham bekor bo'lmaydi.
    if (status === "CANCELLED" && current.paymentStatus === "PAID") {
      try {
        const refund = await createRefund(current);
        if (refund.status === "canceled") throw new Error("Refund canceled");
      } catch (error) {
        logger.error(`Buyurtma #${id} pulini qaytarishda xatolik:`, error);
        return res.status(502).json({ error: "Pul qaytarilmadi", code: "REFUND_FAILED" });
      }
      await setOrderPayment(id, { paymentStatus: "REFUNDED" });
    }

    const order = await updateOrderStatus(id, status);
    notifyCustomerOrderStatus(order);
    res.json({ order: withoutToken(order) });
  } catch (error) {
    logger.error("Statusni yangilashda xatolik:", error);
    res.status(500).json({ error: "Ichki xatolik" });
  }
}
