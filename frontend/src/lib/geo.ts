import { CAFES, type Cafe } from "@/data/cafes";

/**
 * Ikki koordinata orasidagi masofani km'da hisoblaydi (Haversine formulasi).
 */
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Berilgan koordinataga eng yaqin kafeni topadi.
 */
export function nearestCafe(lat: number, lng: number): Cafe {
  return CAFES.reduce((closest, cafe) => {
    const d = distanceKm(lat, lng, cafe.lat, cafe.lng);
    const closestD = distanceKm(lat, lng, closest.lat, closest.lng);
    return d < closestD ? cafe : closest;
  }, CAFES[0]);
}

/**
 * Koordinata bo'yicha taxminiy manzilni topadi (OpenStreetMap Nominatim,
 * bepul, API kalitsiz). Xato bo'lsa null qaytaradi — bu holda foydalanuvchi
 * manzilni qo'lda kiritadi.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ru`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.display_name ?? null;
  } catch {
    return null;
  }
}
