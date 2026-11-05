// Yandex Доставка zayavkasining yakuniy holatlari — bulardan keyin holat so'ralmaydi
// va kuryerni qayta chaqirish mumkin.
export const COURIER_FINAL_STATUSES = [
  "estimating_failed",
  "performer_not_found",
  "delivered",
  "delivered_finish",
  "returned_finish",
  "failed",
  "cancelled",
  "cancelled_with_payment",
  "cancelled_by_taxi",
  "cancelled_with_items_on_hands",
];

export function isCourierActive(order) {
  return Boolean(order.courierClaimId) && !COURIER_FINAL_STATUSES.includes(order.courierStatus);
}
