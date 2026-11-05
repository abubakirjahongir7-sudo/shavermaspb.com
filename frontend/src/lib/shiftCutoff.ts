// Smena "kuni" tungi 00:00 emas, soat 10:00 dan boshlanadi — admin panel
// shu vaqtdan keyingi buyurtmalarni "bugungi" deb hisoblaydi (kechqurungi
// va tungi smena ham shu 10:00 dan 10:00 gacha oynaga kiradi).
export const SHIFT_START_HOUR = 10;

/**
 * Joriy smenaning boshlanish vaqtini qaytaradi: agar hozir soat 10:00 dan
 * keyin bo'lsa — bugungi 10:00; aks holda — kechagi 10:00.
 */
export function getShiftCutoff(now = new Date()): Date {
  const cutoff = new Date(now);
  cutoff.setHours(SHIFT_START_HOUR, 0, 0, 0);
  if (now < cutoff) {
    cutoff.setDate(cutoff.getDate() - 1);
  }
  return cutoff;
}
