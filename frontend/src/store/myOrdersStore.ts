import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface MyOrder {
  id: number;
  token: string;
  createdAt: string;
}

const MAX_ORDERS = 10;

interface MyOrdersState {
  orders: MyOrder[];
  addOrder: (order: MyOrder) => void;
}

/**
 * Mijozning shu qurilmada bergan buyurtmalari (id + kuzatuv tokeni) —
 * ilovani yopib qayta ochganda ham buyurtma holatini ko'rishi uchun.
 * Eng yangisi birinchi turadi.
 */
export const useMyOrdersStore = create<MyOrdersState>()(
  persist(
    (set) => ({
      orders: [],
      addOrder: (order) =>
        set((state) => ({
          orders: [order, ...state.orders.filter((o) => o.id !== order.id)].slice(0, MAX_ORDERS),
        })),
    }),
    { name: "my-orders" }
  )
);
