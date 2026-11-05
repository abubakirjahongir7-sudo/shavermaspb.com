// Frontend'dagi src/data/cafes.ts bilan bir xil ro'yxat (TODO: umumlashtirish).
// Bu yerda faqat kelgan cafeId'ni tekshirish va bot xabarlarida nom/manzilni
// ko'rsatish uchun ishlatiladi.
export const CAFES = [
  {
    id: "grazhdanskiy-39b",
    name: "Гражданский пр., 39Б",
    address: "Гражданский проспект, дом 39Б, Санкт-Петербург",
    // Taxminiy koordinata — yetkazib berish masofasini hisoblash uchun.
    lat: 60.0125,
    lng: 30.3955,
  },
];

export function findCafe(cafeId) {
  return CAFES.find((cafe) => cafe.id === cafeId);
}
