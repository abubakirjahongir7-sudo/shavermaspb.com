import { CAFES } from "../data/cafes.js";
import { DELIVERY_CONFIG } from "../data/delivery.js";
import { logger } from "./logger.js";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

export function distanceKm(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isValidCoords(lat, lng) {
  return (
    Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
  );
}

/** Manzil matnidan koordinata topadi. Topilmasa null, tarmoq xatosida exception. */
export async function geocodeAddress(address) {
  const query = /петербург|спб/i.test(address) ? address : `${address}, Санкт-Петербург`;
  const url = `${NOMINATIM_URL}?format=json&limit=1&countrycodes=ru&accept-language=ru&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "ShavermaSPB/1.0" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);

  const [first] = await res.json();
  if (!first) return null;
  return { lat: Number(first.lat), lng: Number(first.lon) };
}

/**
 * Manzil yoki koordinata bo'yicha yetkazib berish narxini hisoblaydi.
 * Javob: { available: true, fee, distanceKm, lat, lng } yoki
 * { available: false, reason: "ADDRESS_NOT_FOUND" | "GEOCODE_FAILED" | "OUT_OF_ZONE" }.
 */
export async function quoteDelivery({ address, latitude, longitude }) {
  let coords = isValidCoords(latitude, longitude) ? { lat: latitude, lng: longitude } : null;

  if (!coords) {
    try {
      coords = await geocodeAddress(address);
    } catch (error) {
      logger.error("Manzilni aniqlashda xatolik:", error);
      return { available: false, reason: "GEOCODE_FAILED" };
    }
    if (!coords) return { available: false, reason: "ADDRESS_NOT_FOUND" };
  }

  const cafe = CAFES[0];
  const km = distanceKm(cafe.lat, cafe.lng, coords.lat, coords.lng);
  const zone = DELIVERY_CONFIG.zones.find((z) => km <= z.maxKm);
  if (!zone) return { available: false, reason: "OUT_OF_ZONE" };

  return {
    available: true,
    fee: zone.fee,
    distanceKm: Math.round(km * 10) / 10,
    lat: coords.lat,
    lng: coords.lng,
  };
}
