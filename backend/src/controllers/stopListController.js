import { listStoppedItemIds, stopItem, unstopItem } from "../models/StoppedItem.js";
import { findMenuItem } from "../data/menuItems.js";
import { findCafe } from "../data/cafes.js";
import { logger } from "../utils/logger.js";

/**
 * GET /api/stop-list?cafeId=... — ochiq (auth'siz) endpoint, PWA
 * menyusi shu filialning ro'yxatidagi mahsulotlarni ranssiz va bloklangan
 * qilib ko'rsatadi. Har bir filial alohida stop-listga ega.
 */
export async function getStopListHandler(req, res) {
  const { cafeId } = req.query;
  if (!cafeId || !findCafe(cafeId)) {
    return res.status(400).json({ error: "Noto'g'ri cafeId" });
  }

  try {
    const itemIds = await listStoppedItemIds(cafeId);
    res.json({ itemIds });
  } catch (error) {
    logger.error("Stop-listni olishda xatolik:", error);
    res.status(500).json({ error: "Ichki xatolik" });
  }
}

/** POST /api/admin/stop-list/:cafeId/:itemId — mahsulotni shu filialda "tugadi" deb belgilash. */
export async function addStopHandler(req, res) {
  const { cafeId, itemId } = req.params;
  if (!findCafe(cafeId)) {
    return res.status(400).json({ error: "Noto'g'ri cafeId" });
  }
  if (!findMenuItem(itemId)) {
    return res.status(400).json({ error: "Noto'g'ri itemId" });
  }

  try {
    await stopItem(cafeId, itemId);
    res.json({ ok: true });
  } catch (error) {
    logger.error("Mahsulotni stop-listga qo'shishda xatolik:", error);
    res.status(500).json({ error: "Ichki xatolik" });
  }
}

/** DELETE /api/admin/stop-list/:cafeId/:itemId — mahsulotni shu filialda qayta sotuvga qaytarish. */
export async function removeStopHandler(req, res) {
  const { cafeId, itemId } = req.params;
  if (!findCafe(cafeId)) {
    return res.status(400).json({ error: "Noto'g'ri cafeId" });
  }

  try {
    await unstopItem(cafeId, itemId);
    res.json({ ok: true });
  } catch (error) {
    logger.error("Mahsulotni stop-listdan olishda xatolik:", error);
    res.status(500).json({ error: "Ichki xatolik" });
  }
}
