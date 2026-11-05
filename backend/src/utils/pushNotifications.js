import webpush from "web-push";
import { config } from "../config/default.js";
import { findCafe } from "../data/cafes.js";
import {
  listPushSubscriptions,
  deletePushSubscription,
} from "../models/PushSubscription.js";
import {
  listCustomerPushSubscriptions,
  deleteCustomerPushSubscription,
  deleteCustomerPushSubscriptionsForOrder,
} from "../models/CustomerPushSubscription.js";
import { logger } from "./logger.js";

export function isPushEnabled() {
  return Boolean(config.vapidPublicKey && config.vapidPrivateKey);
}

if (isPushEnabled()) {
  webpush.setVapidDetails(config.vapidSubject, config.vapidPublicKey, config.vapidPrivateKey);
}

/**
 * Bildirishnomani bitta obunaga yuboradi. Obuna muddati o'tgan yoki
 * foydalanuvchi uni bekor qilgan bo'lsa (404/410) — `onGone` chaqiriladi.
 */
async function sendPush(sub, payload, onGone) {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload),
      // Telefon uyquda bo'lsa ham darhol yetkazilsin; yetib bormasa
      // 1 soatdan keyin eskirgan hisoblanadi.
      { TTL: 3600, urgency: "high" }
    );
  } catch (error) {
    if (error?.statusCode === 404 || error?.statusCode === 410) {
      await onGone();
    } else {
      logger.error("Push yuborishda xatolik:", error);
    }
  }
}

/**
 * Bildirishnoma matni va bosilganda ochiladigan admin sahifasi.
 * Har bir filialning o'z qulflangan admin paneli bor.
 */
export function buildOrderPushPayload(order) {
  const where =
    order.orderType === "DELIVERY"
      ? `🚚 Доставка: ${order.address ?? "—"}`
      : `🏠 ${findCafe(order.cafeId)?.name ?? order.cafeId ?? "—"}`;

  return {
    title: `🆕 Новый заказ #${order.id}`,
    body: `${where}\nИтого: ${order.total} ₽`,
    tag: `order-${order.id}`,
    url: "/admin",
  };
}

/**
 * Yangi buyurtma haqida shu filialga obuna bo'lgan barcha admin
 * qurilmalariga Web Push yuboradi. Yetkazib berish buyurtmasida filial
 * yo'q — shuning uchun hamma qurilmaga yuboriladi.
 */
export async function notifyAdminDevicesNewOrder(order) {
  if (!isPushEnabled()) return;

  try {
    const cafeId = order.orderType === "DELIVERY" ? null : order.cafeId;
    const subscriptions = await listPushSubscriptions(cafeId);
    const payload = buildOrderPushPayload(order);

    await Promise.all(
      subscriptions.map((sub) => sendPush(sub, payload, () => deletePushSubscription(sub.endpoint)))
    );
  } catch (error) {
    logger.error("Push obunalarini olishda xatolik:", error);
  }
}

const FINAL_STATUSES = ["DELIVERED", "CANCELLED"];

/**
 * Mijozga yuboriladigan bildirishnoma. PENDING (yangi) uchun yuborilmaydi —
 * mijoz buyurtmani o'zi hozirgina bergan.
 */
export function buildCustomerStatusPayload(order) {
  const texts = {
    CONFIRMED: { title: `✅ Заказ #${order.id} принят`, body: "Уже готовим ваш заказ!" },
    READY:
      order.orderType === "DELIVERY"
        ? { title: `🍽 Заказ #${order.id} готов`, body: "Скоро передадим курьеру." }
        : { title: `🍽 Заказ #${order.id} готов`, body: "Можно забирать! Приятного аппетита 🙌" },
    OUT_FOR_DELIVERY: { title: `🛵 Заказ #${order.id} в пути`, body: "Курьер уже едет к вам." },
    DELIVERED: { title: `🚚 Заказ #${order.id} доставлен`, body: "Приятного аппетита!" },
    CANCELLED: { title: `❌ Заказ #${order.id} отменён`, body: "Если это ошибка — позвоните нам." },
  };
  const text = texts[order.status];
  if (!text) return null;

  return {
    ...text,
    tag: `my-order-${order.id}`,
    url: `/order/${order.id}?t=${order.trackingToken}`,
  };
}

/** Buyurtma holati o'zgarganda — shu buyurtmaga obuna bo'lgan mijoz qurilmalariga push. */
export async function notifyCustomerOrderStatus(order) {
  if (!isPushEnabled()) return;
  const payload = buildCustomerStatusPayload(order);
  if (!payload) return;

  try {
    const subscriptions = await listCustomerPushSubscriptions(order.id);
    await Promise.all(
      subscriptions.map((sub) => sendPush(sub, payload, () => deleteCustomerPushSubscription(sub.id)))
    );
    if (FINAL_STATUSES.includes(order.status)) {
      await deleteCustomerPushSubscriptionsForOrder(order.id);
    }
  } catch (error) {
    logger.error("Mijozga push yuborishda xatolik:", error);
  }
}
