export interface Cafe {
  id: string;
  name: string;
  address: string;
  landmark: string;
  lat: number;
  lng: number;
}

export const CAFES: Cafe[] = [
  {
    id: "grazhdanskiy-39b",
    name: "Гражданский пр., 39Б",
    address: "Гражданский проспект, дом 39Б, Санкт-Петербург",
    landmark: "м. «Академическая»",
    // Taxminiy koordinata — faqat "eng yaqin filial"ni tanlash uchun kerak.
    lat: 60.0125,
    lng: 30.3955,
  },
];

export function findCafe(cafeId: string | null | undefined): Cafe | undefined {
  return CAFES.find((cafe) => cafe.id === cafeId);
}
