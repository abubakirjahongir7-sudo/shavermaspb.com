import { create } from "zustand";
import type { MenuItem } from "@/data/menuItems";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  // Mijozning shu mahsulotga oid izohi (masalan "без лука", "соус
  // алohida") — savat sahifasida yoziladi, buyurtma bilan birga
  // yuboriladi va admin panelda/bot xabarida ko'rinadi.
  comment?: string;
}

interface CartState {
  items: Record<string, CartItem>;
  add: (item: MenuItem) => void;
  remove: (item: MenuItem) => void;
  setComment: (itemId: string, comment: string) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  items: {},

  add: (item) =>
    set((state) => {
      const existing = state.items[item.id];
      return {
        items: {
          ...state.items,
          [item.id]: {
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: (existing?.quantity ?? 0) + 1,
            comment: existing?.comment,
          },
        },
      };
    }),

  remove: (item) =>
    set((state) => {
      const existing = state.items[item.id];
      if (!existing) return state;

      const nextQuantity = existing.quantity - 1;
      const nextItems = { ...state.items };

      if (nextQuantity <= 0) {
        delete nextItems[item.id];
      } else {
        nextItems[item.id] = { ...existing, quantity: nextQuantity };
      }

      return { items: nextItems };
    }),

  setComment: (itemId, comment) =>
    set((state) => {
      const existing = state.items[itemId];
      if (!existing) return state;

      return {
        items: {
          ...state.items,
          // Har bir belgi kiritilganda .trim() qilinmaydi — aks holda
          // mijoz yozayotgan paytda so'z oxiridagi probel darhol o'chib
          // ketib, so'zlar bir-biriga yopishib qolardi (masalan "без
          // лука" o'rniga "безлука"). Yakuniy trim buyurtma yuborishda
          // (backend'da) qilinadi.
          [itemId]: { ...existing, comment: comment.trim().length > 0 ? comment : undefined },
        },
      };
    }),

  clear: () => set({ items: {} }),
}));
