import { findOrderByPaymentId, markOrderPaid, markOrderPaymentCanceled } from "../models/Order.js";
import { broadcastNewOrder } from "../core/sseClients.js";
import { notifyAdminDevicesNewOrder } from "../utils/pushNotifications.js";
import { getPayment } from "../utils/yookassa.js";
import { logger } from "../utils/logger.js";

/**
 * To'lov holatini buyurtmaga qo'llaydi. Webhook va mijoz sahifasi bir vaqtda
 * chaqirishi mumkin — shu sabab admin faqat bir marta xabar oladi.
 * Summasi mos kelmagan to'lov to'langan deb hisoblanmaydi.
 */
export async function applyPayment(order, payment) {
  if (payment.status === "succeeded") {
    if (Number(payment.amount?.value) !== order.total) {
      logger.error(`To'lov summasi mos emas: buyurtma #${order.id}, to'lov ${payment.id}`);
      return order;
    }
    const paid = await markOrderPaid(order.id);
    if (paid) {
      broadcastNewOrder(paid);
      notifyAdminDevicesNewOrder(paid);
      return paid;
    }
  } else if (payment.status === "canceled") {
    return (await markOrderPaymentCanceled(order.id)) ?? order;
  }
  return order;
}

/**
 * POST /api/payments/yookassa — ЮKassa bildirishnomasi. Xabar matniga
 * ishonilmaydi: to'lov holati API'dan qayta so'raladi. 200 dan boshqa javobda
 * ЮKassa 24 soat davomida qayta yuboradi.
 */
export async function yookassaWebhookHandler(req, res) {
  const paymentId = req.body?.object?.id;
  if (typeof paymentId !== "string" || !req.body?.event?.startsWith("payment.")) {
    return res.status(200).end();
  }

  try {
    const order = await findOrderByPaymentId(paymentId);
    if (order) await applyPayment(order, await getPayment(paymentId));
    res.status(200).end();
  } catch (error) {
    logger.error("ЮKassa bildirishnomasini qayta ishlashda xatolik:", error);
    res.status(500).end();
  }
}
