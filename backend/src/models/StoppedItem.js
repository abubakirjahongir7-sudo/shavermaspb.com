import { prisma } from "../database/connection.js";

/**
 * Berilgan filialda hozir "stop"da turgan mahsulot id'larini qaytaradi.
 * Har bir filial o'z alohida stop-listiga ega.
 * @param {string} cafeId
 * @returns {Promise<string[]>}
 */
export async function listStoppedItemIds(cafeId) {
  const rows = await prisma.stoppedItem.findMany({
    where: { cafeId },
    select: { itemId: true },
  });
  return rows.map((r) => r.itemId);
}

/**
 * Mahsulotni shu filialning stop-listiga qo'shadi (allaqachon bo'lsa —
 * hech narsa qilmaydi). Boshqa filiallarga ta'sir qilmaydi.
 */
export async function stopItem(cafeId, itemId) {
  await prisma.stoppedItem.upsert({
    where: { cafeId_itemId: { cafeId, itemId } },
    create: { cafeId, itemId },
    update: {},
  });
}

/**
 * Mahsulotni shu filialning stop-listidan olib tashlaydi (u yerda
 * bo'lmasa — hech narsa qilmaydi). Boshqa filiallarga ta'sir qilmaydi.
 */
export async function unstopItem(cafeId, itemId) {
  await prisma.stoppedItem.deleteMany({ where: { cafeId, itemId } });
}
