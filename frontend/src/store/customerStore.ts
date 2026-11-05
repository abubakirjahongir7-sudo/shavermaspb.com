import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CustomerState {
  name: string;
  phone: string;
  setName: (name: string) => void;
  setPhone: (phone: string) => void;
}

/**
 * Mijoz birinchi buyurtma berayotganda kiritgan ismi va telefon
 * raqami — shu yerda saqlanadi, shuning uchun keyingi
 * buyurtmalarda qayta so'ralmaydi.
 */
export const useCustomerStore = create<CustomerState>()(
  persist(
    (set) => ({
      name: "",
      phone: "",
      setName: (name) => set({ name }),
      setPhone: (phone) => set({ phone }),
    }),
    { name: "customer-contact" }
  )
);
