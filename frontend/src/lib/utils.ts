/**
 * Narxni "289 ₽" formatida chiqarish uchun yordamchi funksiya.
 */
export function formatPrice(value: number): string {
  return `${value.toLocaleString("ru-RU")} ₽`;
}
