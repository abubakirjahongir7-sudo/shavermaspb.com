import { prisma } from "../database/connection.js";

/**
 * Qurilma obunasini saqlaydi. Xuddi shu endpoint qayta yuborilsa
 * (masalan, qurilma boshqa filialga o'tkazilgan bo'lsa) — yangilanadi.
 * @param {{ endpoint: string, p256dh: string, auth: string, cafeId: string }} sub
 */
export async function savePushSubscription({ endpoint, p256dh, auth, cafeId }) {
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { endpoint, p256dh, auth, cafeId },
    update: { p256dh, auth, cafeId },
  });
}

/** Obunani o'chiradi (bo'lmasa — hech narsa qilmaydi). */
export async function deletePushSubscription(endpoint) {
  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
}

/**
 * Berilgan filialga tegishli obunalar. cafeId berilmasa — hammasi
 * (masalan, filialga bog'lanmagan yetkazib berish buyurtmalari uchun).
 * @param {string | null | undefined} cafeId
 */
export async function listPushSubscriptions(cafeId) {
  return prisma.pushSubscription.findMany({ where: cafeId ? { cafeId } : undefined });
}
