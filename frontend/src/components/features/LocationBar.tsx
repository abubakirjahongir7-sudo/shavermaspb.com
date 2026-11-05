"use client";

import { useEffect, useState } from "react";
import { useOrderStore } from "@/store/orderStore";
import { findCafe } from "@/data/cafes";
import { useGeolocation } from "@/hooks/useGeolocation";
import { nearestCafe } from "@/lib/geo";
import { AddressSheet } from "./AddressSheet";
import styles from "./LocationBar.module.css";

/**
 * Header ostida ko'rinadigan qator — hozirgi tanlov (Самовывоз/Доставка +
 * kafe yoki manzil) qisqacha ko'rsatiladi, bosilsa AddressSheet ochiladi.
 * Ilova birinchi ochilganda GPS lokatsiyasi so'raladi va eng yaqin kafe
 * (yoki yetkazib berish uchun taxminiy manzil) avtomatik tanlanadi.
 */
export function LocationBar() {
  const {
    fulfillmentType,
    cafeId,
    address,
    autoSelected,
    setCafeId,
    setCoords,
  } = useOrderStore();
  const { coords, requestLocation } = useGeolocation();
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!coords) return;
    setCoords(coords);

    if (autoSelected) {
      setCafeId(nearestCafe(coords.lat, coords.lng).id, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords]);

  const cafe = findCafe(cafeId);
  const summary =
    fulfillmentType === "DELIVERY" ? address || "Укажите адрес доставки" : cafe?.name ?? "";

  return (
    <>
      <button type="button" className={styles.bar} onClick={() => setSheetOpen(true)}>
        <span className={styles.icon}>{fulfillmentType === "DELIVERY" ? "🚚" : "📍"}</span>
        <span className={styles.text}>
          <span className={styles.label}>
            {fulfillmentType === "DELIVERY" ? "Доставка" : "Самовывоз"}
          </span>
          <span className={styles.value}>{summary}</span>
        </span>
        <span className={styles.change}>Изменить</span>
      </button>

      <AddressSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  );
}
