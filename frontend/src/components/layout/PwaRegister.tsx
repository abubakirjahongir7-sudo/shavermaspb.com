"use client";

import { useEffect } from "react";

/**
 * Service worker'ni ro'yxatdan o'tkazadi — bu ilovani iPhone/Android'da
 * "Bosh ekranga qo'shish" orqali PWA sifatida o'rnatish mumkin bo'lishi
 * uchun kerak (Chrome/Android bunga alohida shart qo'yadi). Service
 * worker hech narsani keshlamaydi — faqat shu shartni bajaradi.
 */
export function PwaRegister() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // PWA sifatida o'rnatish imkoniyati bo'lmay qoladi, lekin ilovaning
      // o'zi oddiy brauzerda baribir ishlayveradi.
    });
  }, []);

  return null;
}
