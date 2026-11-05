"use client";

import { useEffect, useState } from "react";
import { CAFES } from "@/data/cafes";
import { useOrderStore, type FulfillmentType } from "@/store/orderStore";
import { useGeolocation } from "@/hooks/useGeolocation";
import { nearestCafe, reverseGeocode } from "@/lib/geo";
import { fetchCheckoutConfig, fetchDeliveryQuote } from "@/lib/api";
import styles from "./AddressSheet.module.css";

const QUOTE_ERRORS = {
  ADDRESS_NOT_FOUND: "Адрес не найден. Уточните улицу и дом или определите местоположение.",
  GEOCODE_FAILED: "Не удалось проверить адрес. Определите местоположение или попробуйте позже.",
  OUT_OF_ZONE: "К сожалению, мы не доставляем по этому адресу.",
};

interface AddressSheetProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Pastdan chiqadigan panel — mijoz "Самовывоз" yoki "Доставка" (GPS'dan
 * avtomatik yoki qo'lda kiritilgan manzil) orasida tanlov qiladi. Manzil
 * saqlanishidan oldin server yetkazib berish narxini hisoblaydi.
 */
export function AddressSheet({ open, onClose }: AddressSheetProps) {
  const {
    fulfillmentType,
    cafeId,
    address,
    setFulfillmentType,
    setCafeId,
    setAddress,
    setCoords,
    setDelivery,
  } = useOrderStore();

  const [tab, setTab] = useState<FulfillmentType>(fulfillmentType);
  const [selectedCafeId, setSelectedCafeId] = useState(cafeId);
  const [addressInput, setAddressInput] = useState(address);
  // Manzil GPS'dan olingan va o'zgartirilmagan bo'lsagina koordinatasi ishlatiladi.
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState("");
  const [deliveryEnabled, setDeliveryEnabled] = useState(false);
  const geo = useGeolocation();

  useEffect(() => {
    if (open) {
      setTab(fulfillmentType);
      setSelectedCafeId(cafeId);
      setAddressInput(address);
      setGpsCoords(null);
      setQuoteError("");
    }
  }, [open, fulfillmentType, cafeId, address]);

  useEffect(() => {
    if (!open) return;
    fetchCheckoutConfig()
      .then((config) => setDeliveryEnabled(config.deliveryEnabled))
      .catch(() => setDeliveryEnabled(false));
  }, [open]);

  useEffect(() => {
    if (!geo.coords) return;
    setCoords(geo.coords);

    if (tab === "PICKUP") {
      setSelectedCafeId(nearestCafe(geo.coords.lat, geo.coords.lng).id);
    } else {
      const found = geo.coords;
      reverseGeocode(found.lat, found.lng).then((result) => {
        if (result) {
          setAddressInput(result);
          setGpsCoords(found);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo.coords]);

  if (!open) return null;

  const canSave = tab === "PICKUP" ? Boolean(selectedCafeId) : addressInput.trim().length > 0;

  const handleSave = async () => {
    if (tab === "PICKUP") {
      setFulfillmentType(tab);
      setCafeId(selectedCafeId, true);
      onClose();
      return;
    }

    const value = addressInput.trim();
    setQuoting(true);
    setQuoteError("");
    try {
      const quote = await fetchDeliveryQuote(value, gpsCoords);
      if (!quote.available) {
        setQuoteError(QUOTE_ERRORS[quote.reason]);
        return;
      }
      setFulfillmentType(tab);
      setAddress(value);
      setDelivery({ lat: quote.lat, lng: quote.lng }, quote.fee);
      onClose();
    } catch {
      setQuoteError(QUOTE_ERRORS.GEOCODE_FAILED);
    } finally {
      setQuoting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Как вы хотите получить заказ?</h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </div>

        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tab} ${tab === "PICKUP" ? styles.tabActive : ""}`}
            onClick={() => setTab("PICKUP")}
          >
            🏠 Самовывоз
          </button>
          {deliveryEnabled ? (
            <button
              type="button"
              className={`${styles.tab} ${tab === "DELIVERY" ? styles.tabActive : ""}`}
              onClick={() => setTab("DELIVERY")}
            >
              🚚 Доставка
            </button>
          ) : (
            <button type="button" className={styles.tabDisabled} disabled>
              🚚 Доставка <span className={styles.soon}>скоро</span>
            </button>
          )}
        </div>

        {tab === "PICKUP" ? (
          <div className={styles.cafeList}>
            {CAFES.map((cafe) => (
              <button
                key={cafe.id}
                type="button"
                className={`${styles.cafeCard} ${
                  selectedCafeId === cafe.id ? styles.cafeCardActive : ""
                }`}
                onClick={() => setSelectedCafeId(cafe.id)}
              >
                <span className={styles.cafeName}>{cafe.name}</span>
                <span className={styles.cafeLandmark}>{cafe.landmark}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className={styles.deliveryBlock}>
            <button
              type="button"
              className={styles.locateBtn}
              onClick={geo.requestLocation}
              disabled={geo.status === "loading"}
            >
              {geo.status === "loading" ? "Определяем…" : "📍 Определить моё местоположение"}
            </button>
            {geo.status === "error" && <p className={styles.geoError}>{geo.error}</p>}

            <textarea
              className={styles.addressInput}
              placeholder="Улица, дом, квартира, подъезд, этаж…"
              value={addressInput}
              onChange={(e) => {
                setAddressInput(e.target.value);
                setGpsCoords(null);
                setQuoteError("");
              }}
              rows={3}
            />
            {quoteError && <p className={styles.geoError}>{quoteError}</p>}
          </div>
        )}

        <button type="button" className={styles.saveBtn} disabled={!canSave || quoting} onClick={handleSave}>
          {quoting ? "Проверяем адрес…" : "Сохранить"}
        </button>
      </div>
    </div>
  );
}
