import { prisma } from "../database/connection.js";

/** @param {{ orderId: number, endpoint: string, p256dh: string, auth: string }} sub */
export async function saveCustomerPushSubscription({ orderId, endpoint, p256dh, auth }) {
  await prisma.customerPushSubscription.upsert({
    where: { orderId_endpoint: { orderId, endpoint } },
    create: { orderId, endpoint, p256dh, auth },
    update: { p256dh, auth },
  });
}

export async function listCustomerPushSubscriptions(orderId) {
  return prisma.customerPushSubscription.findMany({ where: { orderId } });
}

export async function deleteCustomerPushSubscription(id) {
  await prisma.customerPushSubscription.deleteMany({ where: { id } });
}

/** Buyurtma yakunlangach (yetkazildi/bekor) obunalar endi kerak emas. */
export async function deleteCustomerPushSubscriptionsForOrder(orderId) {
  await prisma.customerPushSubscription.deleteMany({ where: { orderId } });
}
