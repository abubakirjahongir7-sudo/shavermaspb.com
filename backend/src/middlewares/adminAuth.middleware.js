import crypto from "node:crypto";
import { config } from "../config/default.js";

/**
 * Ikki satrni "vaqt bo'yicha xavfsiz" solishtiradi — oddiy `===` bilan
 * solishtirsak, javob qaytish vaqti mos kelgan belgilar soniga qarab
 * ozgina farq qilishi mumkin (timing attack). Uzunliklar farq qilsa ham
 * doim to'liq solishtiruv vaqtini sarflaymiz.
 */
export function safeEqual(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Admin panel API'sini oddiy parol bilan himoyalaydi.
 * Frontend har bir so'rovda `Authorization: Bearer <parol>` header'ini yuboradi.
 */
export function adminAuth(req, res, next) {
  if (!config.adminPassword) {
    return res.status(500).json({ error: "ADMIN_PASSWORD sozlanmagan" });
  }

  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!safeEqual(token, config.adminPassword)) {
    return res.status(401).json({ error: "Ruxsat yo'q" });
  }

  next();
}
