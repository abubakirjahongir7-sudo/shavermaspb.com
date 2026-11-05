import { fetchPushPublicKey } from "@/lib/api";

// unsupported   — brauzer Web Push'ni umuman qo'llamaydi
// needs-install — iPhone: push faqat "Bosh ekranga qo'shilgan" PWA'da ishlaydi
// denied        — foydalanuvchi bildirishnomalarni rad etgan (sozlamalardan yoqish kerak)
// off           — hali yoqilmagan (tugma ko'rsatiladi)
// on            — shu qurilma obuna bo'lgan
export type PushStatus = "unsupported" | "needs-install" | "denied" | "off" | "on" | "loading" | "error";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export function isIos() {
  return /iPhone|iPad|iPod/.test(navigator.userAgent);
}

export function isStandalone() {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** Push holatini birinchi renderda aniqlash (ruxsat so'ralmaydi). */
export function detectInitialPushStatus(): PushStatus {
  if (typeof window === "undefined") return "loading";
  const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  if (!supported) return isIos() && !isStandalone() ? "needs-install" : "unsupported";
  if (Notification.permission === "denied") return "denied";
  return "loading";
}

/** Ruxsat avvalroq berilgan bo'lsa — mavjud obunani qaytaradi (yangisini yaratmaydi). */
export async function getExistingSubscription(): Promise<PushSubscription | null> {
  if (Notification.permission !== "granted") return null;
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

/**
 * Ruxsat so'raydi va qurilmaning push obunasini qaytaradi. Faqat tugma
 * bosilganda chaqirilishi kerak — iOS ruxsat oynasini faqat foydalanuvchi
 * harakatidan keyin ko'rsatadi. Rad etilsa — "denied"/"off" qaytaradi.
 */
export async function requestPushSubscription(): Promise<PushSubscription | "denied" | "off"> {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission === "denied" ? "denied" : "off";

  const publicKey = await fetchPushPublicKey();
  const registration = await navigator.serviceWorker.ready;
  return (
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    }))
  );
}
