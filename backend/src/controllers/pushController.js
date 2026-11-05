import { config } from "../config/default.js";
import { findCafe } from "../data/cafes.js";
import {
  savePushSubscription,
  deletePushSubscription,
} from "../models/PushSubscription.js";
import { isPushEnabled } from "../utils/pushNotifications.js";
import { logger } from "../utils/logger.js";

/** GET /api/admin/push/public-key — frontend obuna bo'lishi uchun VAPID kaliti. */
export function getPushPublicKeyHandler(req, res) {
  if (!isPushEnabled()) {
    return res.status(503).json({ error: "Push sozlanmagan" });
  }
  res.json({ publicKey: config.vapidPublicKey });
}

/**
 * POST /api/admin/push/subscribe
 * Body: { subscription: { endpoint, keys: { p256dh, auth } }, cafeId }
 */
export async function subscribePushHandler(req, res) {
  const { subscription, cafeId } = req.body ?? {};
  const endpoint = subscription?.endpoint;
  const p256dh = subscription?.keys?.p256dh;
  const auth = subscription?.keys?.auth;

  if (typeof endpoint !== "string" || !endpoint.startsWith("https://") || !p256dh || !auth) {
    return res.status(400).json({ error: "Noto'g'ri subscription" });
  }
  if (!findCafe(cafeId)) {
    return res.status(400).json({ error: "Noto'g'ri cafeId" });
  }

  try {
    await savePushSubscription({ endpoint, p256dh, auth, cafeId });
    res.status(201).json({ ok: true });
  } catch (error) {
    logger.error("Push obunani saqlashda xatolik:", error);
    res.status(500).json({ error: "Ichki xatolik" });
  }
}

/** POST /api/admin/push/unsubscribe  Body: { endpoint } */
export async function unsubscribePushHandler(req, res) {
  const { endpoint } = req.body ?? {};
  if (typeof endpoint !== "string" || !endpoint) {
    return res.status(400).json({ error: "endpoint majburiy" });
  }

  try {
    await deletePushSubscription(endpoint);
    res.json({ ok: true });
  } catch (error) {
    logger.error("Push obunani o'chirishda xatolik:", error);
    res.status(500).json({ error: "Ichki xatolik" });
  }
}
