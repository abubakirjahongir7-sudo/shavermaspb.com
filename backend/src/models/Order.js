import { prisma } from "../database/connection.js";

/**
 * @param {{
 *   customerName: string, phone: string, trackingToken: string,
 *   items: Array<{id: string, name: string, price: number, quantity: number, comment?: string}>,
 *   total: number, orderType?: "PICKUP"|"DELIVERY", cafeId?: string,
 *   address?: string, latitude?: number, longitude?: number
 * }} data
 */
export async function createOrder(data) {
  return prisma.order.create({ data });
}

export async function listOrders({ limit = 100 } = {}) {
  return prisma.order.findMany({
    // Hali to'lanmagan yoki to'lovi bekor bo'lgan karta buyurtmalarini oshxona ko'rmaydi.
    where: { NOT: { paymentMethod: "CARD", paymentStatus: { in: ["PENDING", "CANCELED"] } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getOrderById(id) {
  return prisma.order.findUnique({ where: { id } });
}

export async function updateOrderStatus(id, status) {
  return prisma.order.update({ where: { id }, data: { status } });
}

export async function findOrderByPaymentId(paymentId) {
  return prisma.order.findUnique({ where: { paymentId } });
}

export async function setOrderPayment(id, data) {
  return prisma.order.update({ where: { id }, data });
}

/** PENDING to'lovni PAID qiladi. Allaqachon o'zgargan bo'lsa null qaytaradi. */
export async function markOrderPaid(id) {
  const { count } = await prisma.order.updateMany({
    where: { id, paymentStatus: "PENDING" },
    data: { paymentStatus: "PAID" },
  });
  return count ? getOrderById(id) : null;
}

/** PENDING to'lovni bekor qiladi. Allaqachon o'zgargan bo'lsa null qaytaradi. */
export async function markOrderPaymentCanceled(id) {
  const { count } = await prisma.order.updateMany({
    where: { id, paymentStatus: "PENDING" },
    data: { paymentStatus: "CANCELED", status: "CANCELLED" },
  });
  return count ? getOrderById(id) : null;
}

export async function setOrderCourier(id, data) {
  return prisma.order.update({ where: { id }, data });
}

/** Yandex'da hali yakunlanmagan zayavkali buyurtmalar. */
export async function listOrdersWithCourier(finalStatuses) {
  return prisma.order.findMany({
    where: { courierClaimId: { not: null }, courierStatus: { notIn: finalStatuses } },
  });
}
