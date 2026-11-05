import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CAFES } from "@/data/cafes";

export type FulfillmentType = "PICKUP" | "DELIVERY";

interface OrderState {
  fulfillmentType: FulfillmentType;
  cafeId: string;
  address: string;
  coords: { lat: number; lng: number } | null;
  // Yetkazib berish manzilining koordinatasi va narxi (AddressSheet saqlaydi).
  // `coords` esa qurilmaning hozirgi joyi, manzil bilan bir xil bo'lmasligi mumkin.
  deliveryCoords: { lat: number; lng: number } | null;
  deliveryFee: number;
  // true — kafe hali foydalanuvchi tomonidan qo'lda tanlanmagan, shuning
  // uchun GPS lokatsiya kelganda eng yaqin kafe avtomatik tanlanadi.
  autoSelected: boolean;

  setFulfillmentType: (type: FulfillmentType) => void;
  setCafeId: (cafeId: string, manual?: boolean) => void;
  setAddress: (address: string) => void;
  setCoords: (coords: { lat: number; lng: number } | null) => void;
  setDelivery: (coords: { lat: number; lng: number }, fee: number) => void;
}

/**
 * Mijozning "qanday olish" tanlovi (olib ketish / yetkazib berish) — butun
 * ilova bo'ylab saqlanadi (localStorage) va Header ostidagi LocationBar +
 * savat sahifasida ishlatiladi.
 */
export const useOrderStore = create<OrderState>()(
  persist(
    (set) => ({
      fulfillmentType: "PICKUP",
      cafeId: CAFES[0].id,
      address: "",
      coords: null,
      deliveryCoords: null,
      deliveryFee: 0,
      autoSelected: true,

      setFulfillmentType: (fulfillmentType) => set({ fulfillmentType }),
      setCafeId: (cafeId, manual = true) =>
        set({ cafeId, autoSelected: manual ? false : true }),
      setAddress: (address) => set({ address }),
      setCoords: (coords) => set({ coords }),
      setDelivery: (deliveryCoords, deliveryFee) => set({ deliveryCoords, deliveryFee }),
    }),
    {
      name: "order-fulfillment",
      // Saqlangan filial ro'yxatdan olib tashlangan bo'lsa, birinchisiga qaytamiz.
      merge: (persisted, current) => {
        const merged = { ...current, ...(persisted as Partial<OrderState>) };
        if (!CAFES.some((cafe) => cafe.id === merged.cafeId)) merged.cafeId = CAFES[0].id;
        return merged;
      },
    }
  )
);
