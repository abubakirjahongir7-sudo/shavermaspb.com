"use client";

import { useRouter } from "next/navigation";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/utils";
import styles from "./BottomNavigation.module.css";

/**
 * Savat bo'sh bo'lmaganda ekran pastida suzib turadigan panel.
 * Bosilganda savat sahifasiga o'tadi — yakuniy buyurtma berish shu yerda amalga oshiriladi.
 */
export function BottomNavigation() {
  const { totalCount, totalPrice } = useCart();
  const router = useRouter();

  if (!totalCount) return null;

  return (
    <div className={styles.nav}>
      <button type="button" className={styles.button} onClick={() => router.push("/cart")}>
        <span className={styles.count}>{totalCount}</span>
        <span className={styles.label}>Корзина</span>
        <span className={styles.total}>{formatPrice(totalPrice)}</span>
        <span className={styles.arrow} aria-hidden="true">
          <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
            <path
              d="M1.5 1.5L8 8L1.5 14.5"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
    </div>
  );
}
