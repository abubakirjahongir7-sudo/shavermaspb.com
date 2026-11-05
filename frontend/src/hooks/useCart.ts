"use client";

import { useMemo } from "react";
import { useCartStore } from "@/store/cartStore";
import { menuItems, type MenuItem } from "@/data/menuItems";

/**
 * Savat holatini va u bilan bog'liq hisob-kitoblarni bitta joydan
 * boshqarish uchun hook. Komponentlar to'g'ridan-to'g'ri Zustand
 * store'ga murojaat qilmasdan shu hook orqali ishlaydi.
 */
export function useCart() {
  const items = useCartStore((state) => state.items);
  const add = useCartStore((state) => state.add);
  const remove = useCartStore((state) => state.remove);
  const setComment = useCartStore((state) => state.setComment);
  const clear = useCartStore((state) => state.clear);

  const quantityOf = (itemId: string) => items[itemId]?.quantity ?? 0;

  const cartItems = useMemo(
    () =>
      menuItems
        .filter((item) => items[item.id]?.quantity > 0)
        .map((item) => ({
          ...item,
          quantity: items[item.id].quantity,
          comment: items[item.id].comment,
        })),
    [items]
  );

  const totalCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  const totalPrice = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity * item.price, 0),
    [cartItems]
  );

  return {
    cartItems,
    totalCount,
    totalPrice,
    quantityOf,
    add: (item: MenuItem) => add(item),
    remove: (item: MenuItem) => remove(item),
    setComment,
    clear,
  };
}
