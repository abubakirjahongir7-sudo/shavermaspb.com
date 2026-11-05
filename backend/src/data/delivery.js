// Yetkazib berish shartlari — narxlar kafe egasi bilan kelishilgach shu yerda
// o'zgartiriladi. Masofa kafedan to'g'ri chiziq bo'yicha hisoblanadi (km).
export const DELIVERY_CONFIG = {
  minOrder: 700,
  zones: [
    { maxKm: 3, fee: 150 },
    { maxKm: 7, fee: 250 },
  ],
};
