import type { CartItem } from "@/store/cartStore";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export type FulfillmentType = "PICKUP" | "DELIVERY";
export type PaymentMethod = "CASH" | "CARD";
export type PaymentStatus = "NOT_REQUIRED" | "PENDING" | "PAID" | "CANCELED" | "REFUNDED";

export interface CheckoutPayload {
  items: CartItem[];
  total: number;
  orderType: FulfillmentType;
  cafeId?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  customerName: string;
  phone: string;
  paymentMethod: PaymentMethod;
}

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "READY"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

export interface AdminOrder {
  id: number;
  customerName: string;
  phone: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  orderType: FulfillmentType;
  cafeId?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  deliveryFee: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  courierClaimId?: string | null;
  courierStatus?: string | null;
  courierName?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Mijozga ko'rinadigan o'z buyurtmasi (telefon va kuzatuv tokenisiz). */
export interface TrackedOrder {
  id: number;
  status: OrderStatus;
  orderType: FulfillmentType;
  cafeId?: string | null;
  address?: string | null;
  items: CartItem[];
  total: number;
  deliveryFee: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentUrl?: string;
  customerName: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubmitOrderResult {
  orderId: number;
  trackingToken: string;
  customerName: string;
  paymentUrl?: string;
}

/** Server rad etgan buyurtma — `code` bo'yicha mijozga tushunarli matn ko'rsatiladi. */
export class OrderRejectedError extends Error {
  constructor(public code: string, public minOrder?: number) {
    super(`Order rejected: ${code}`);
  }
}

export type DeliveryQuote =
  | { available: true; fee: number; distanceKm: number; lat: number; lng: number }
  | { available: false; reason: "ADDRESS_NOT_FOUND" | "GEOCODE_FAILED" | "OUT_OF_ZONE" };

export interface CheckoutConfig {
  cardEnabled: boolean;
  deliveryEnabled: boolean;
  delivery: { minOrder: number; zones: { maxKm: number; fee: number }[] };
}

/** Savat uchun sozlamalar: karta yoqilganmi va yetkazib berish shartlari. */
export async function fetchCheckoutConfig(): Promise<CheckoutConfig> {
  const res = await fetch(`${API_BASE_URL}/api/checkout/config`);
  if (!res.ok) {
    throw new Error(`fetchCheckoutConfig failed: ${res.status}`);
  }
  return res.json();
}

/** Manzil bo'yicha yetkazib berish narxi. */
export async function fetchDeliveryQuote(
  address: string,
  coords: { lat: number; lng: number } | null
): Promise<DeliveryQuote> {
  const res = await fetch(`${API_BASE_URL}/api/delivery/quote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, latitude: coords?.lat, longitude: coords?.lng }),
  });
  if (!res.ok) {
    throw new Error(`fetchDeliveryQuote failed: ${res.status}`);
  }
  return res.json();
}

/** Buyurtmani backend'ga yuborish — mijoz "Заказать" bosganda chaqiriladi. */
export async function submitOrder(payload: CheckoutPayload): Promise<SubmitOrderResult> {
  const res = await fetch(`${API_BASE_URL}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    if (data?.code) throw new OrderRejectedError(data.code, data.minOrder);
    throw new Error(`submitOrder failed: ${res.status}`);
  }

  return res.json();
}

/** Mijoz o'z buyurtmasi holatini oladi. Topilmasa (yoki token noto'g'ri) — null. */
export async function fetchTrackedOrder(orderId: number, token: string): Promise<TrackedOrder | null> {
  const res = await fetch(
    `${API_BASE_URL}/api/orders/${orderId}?t=${encodeURIComponent(token)}`,
    { cache: "no-store" }
  );
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`fetchTrackedOrder failed: ${res.status}`);
  }

  const data = await res.json();
  return data.order;
}

/** Mijoz qurilmasini shu buyurtma holati bildirishnomalariga obuna qilish. */
export async function subscribeOrderPush(
  orderId: number,
  token: string,
  subscription: PushSubscriptionJSON
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/push`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, subscription }),
  });

  if (!res.ok) {
    throw new Error(`subscribeOrderPush failed: ${res.status}`);
  }
}

function adminHeaders(password: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${password}`,
  };
}

/**
 * Admin panel — barcha buyurtmalar ro'yxatini olish.
 */
export async function fetchAdminOrders(password: string): Promise<AdminOrder[]> {
  const res = await fetch(`${API_BASE_URL}/api/admin/orders`, {
    headers: adminHeaders(password),
  });

  if (res.status === 401) {
    throw new Error("UNAUTHORIZED");
  }
  if (!res.ok) {
    throw new Error(`fetchAdminOrders failed: ${res.status}`);
  }

  const data = await res.json();
  return data.orders;
}

/**
 * Admin panel — buyurtma holatini o'zgartirish.
 */
export async function updateAdminOrderStatus(
  password: string,
  orderId: number,
  status: OrderStatus
): Promise<AdminOrder> {
  const res = await fetch(`${API_BASE_URL}/api/admin/orders/${orderId}`, {
    method: "PATCH",
    headers: adminHeaders(password),
    body: JSON.stringify({ status }),
  });

  if (res.status === 401) {
    throw new Error("UNAUTHORIZED");
  }
  if (!res.ok) {
    throw new Error(`updateAdminOrderStatus failed: ${res.status}`);
  }

  const data = await res.json();
  return data.order;
}

/** Kuryer so'rovi rad etilganda — `code` va (pullik bekor qilishda) `price`. */
export class CourierError extends Error {
  constructor(public code: string, public price?: string) {
    super(`Courier error: ${code}`);
  }
}

async function courierRequest(
  password: string,
  path: string,
  body?: Record<string, unknown>
): Promise<AdminOrder> {
  const res = await fetch(`${API_BASE_URL}/api/admin/orders/${path}`, {
    method: "POST",
    headers: adminHeaders(password),
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new CourierError(data?.code ?? "COURIER_FAILED", data?.price);
  }
  return data.order;
}

/** Admin panel — Yandex kuryerini chaqirish. */
export function requestCourier(password: string, orderId: number): Promise<AdminOrder> {
  return courierRequest(password, `${orderId}/courier`);
}

/** Admin panel — kuryerni bekor qilish. Pullik bo'lsa, allowPaid bilan tasdiqlanadi. */
export function cancelCourier(
  password: string,
  orderId: number,
  allowPaid = false
): Promise<AdminOrder> {
  return courierRequest(password, `${orderId}/courier/cancel`, { allowPaid });
}

/**
 * Hozir shu filialda "stop"da (tugagan) turgan mahsulot id'lari — PWA
 * menyusi shularni ranssiz va bloklangan qilib ko'rsatadi. Har bir
 * filial alohida stop-listga ega. Auth'siz, ochiq endpoint.
 */
export async function fetchStopList(cafeId: string): Promise<string[]> {
  if (!API_BASE_URL || !cafeId) return [];

  try {
    const res = await fetch(`${API_BASE_URL}/api/stop-list?cafeId=${encodeURIComponent(cafeId)}`);
    if (!res.ok) return [];

    const data = await res.json();
    return data.itemIds ?? [];
  } catch {
    // Tarmoq xatosi (masalan vaqtincha aloqa yo'q) — jim o'tkazib
    // yuboramiz, keyingi pollingda o'zi tuzaladi. Buyurtma yaratishda
    // stop-list baribir server tomonda qayta tekshiriladi, shuning uchun
    // bu yerdagi vaqtinchalik nosozlik mijozga zarar keltirmaydi.
    return [];
  }
}

/** Admin panel — mahsulotni shu filialda "stop"ga qo'yish (tugadi deb belgilash). */
export async function stopMenuItem(
  password: string,
  cafeId: string,
  itemId: string
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/admin/stop-list/${cafeId}/${itemId}`, {
    method: "POST",
    headers: adminHeaders(password),
  });

  if (res.status === 401) {
    throw new Error("UNAUTHORIZED");
  }
  if (!res.ok) {
    throw new Error(`stopMenuItem failed: ${res.status}`);
  }
}

/** Admin panel — mahsulotni shu filialning stop-listidan olib, qayta sotuvga qaytarish. */
export async function unstopMenuItem(
  password: string,
  cafeId: string,
  itemId: string
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/admin/stop-list/${cafeId}/${itemId}`, {
    method: "DELETE",
    headers: adminHeaders(password),
  });

  if (res.status === 401) {
    throw new Error("UNAUTHORIZED");
  }
  if (!res.ok) {
    throw new Error(`unstopMenuItem failed: ${res.status}`);
  }
}

/** Web Push obunasi uchun serverning VAPID ochiq kaliti (admin ham, mijoz ham ishlatadi). */
export async function fetchPushPublicKey(): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/api/push/public-key`);

  if (!res.ok) {
    throw new Error(`fetchPushPublicKey failed: ${res.status}`);
  }

  const data = await res.json();
  return data.publicKey;
}

/** Admin panel — qurilmani shu filialning yangi buyurtma bildirishnomalariga obuna qilish. */
export async function subscribeAdminPush(
  password: string,
  subscription: PushSubscriptionJSON,
  cafeId: string
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/admin/push/subscribe`, {
    method: "POST",
    headers: adminHeaders(password),
    body: JSON.stringify({ subscription, cafeId }),
  });

  if (res.status === 401) {
    throw new Error("UNAUTHORIZED");
  }
  if (!res.ok) {
    throw new Error(`subscribeAdminPush failed: ${res.status}`);
  }
}
