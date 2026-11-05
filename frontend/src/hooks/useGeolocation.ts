"use client";

import { useCallback, useState } from "react";

export type GeoStatus = "idle" | "loading" | "success" | "error" | "unsupported";

interface GeoCoords {
  lat: number;
  lng: number;
}

/**
 * Brauzerning navigator.geolocation API'si orqali foydalanuvchi lokatsiyasini
 * so'raydi (ruxsat oynasini brauzerning o'zi ko'rsatadi).
 */
export function useGeolocation() {
  const [status, setStatus] = useState<GeoStatus>("idle");
  const [coords, setCoords] = useState<GeoCoords | null>(null);
  const [error, setError] = useState("");

  const requestLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setStatus("unsupported");
      return;
    }

    setStatus("loading");
    setError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setStatus("success");
      },
      (err) => {
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Доступ к геолокации запрещён. Вы можете ввести адрес вручную."
            : "Не удалось определить местоположение."
        );
        setStatus("error");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60_000 }
    );
  }, []);

  return { status, coords, error, requestLocation };
}
