"use client";

import type { MenuItem } from "@/data/menuItems";
import { formatPrice } from "@/lib/utils";
import styles from "./DrinkRow.module.css";

interface DrinkRowProps {
  item: MenuItem;
  quantity: number;
  onAdd: (item: MenuItem) => void;
  onRemove: (item: MenuItem) => void;
  accent?: "orange" | "blue";
  stopped?: boolean;
}

/**
 * Ichimliklar uchun rasmsiz, ixcham qator ko'rinishi (har bir ichimlik
 * uchun alohida foto yo'q). Qatorning o'zi toifa rangiga bo'yaladi:
 * "orange" — issiq ichimliklar, "blue" — salqin ichimliklar.
 */
export function DrinkRow({ item, quantity, onAdd, onRemove, accent, stopped }: DrinkRowProps) {
  const { name, weight, price } = item;

  // Har bir "base" klass uchun mos variant klassini qo'shib qaytaradi,
  // masalan cx("row") -> "row rowBlue" (accent="blue" bo'lganda).
  const suffix = accent === "blue" ? "Blue" : accent === "orange" ? "Orange" : "";
  const cx = (base: keyof typeof styles) =>
    suffix ? `${styles[base]} ${styles[`${base}${suffix}`] ?? ""}` : styles[base];

  return (
    <div className={`${cx("row")} ${stopped ? styles.stopped : ""}`}>
      <div className={styles.info}>
        <span className={cx("name")}>{name}</span>
        {weight && <span className={cx("weight")}>{weight}</span>}
      </div>

      <div className={styles.right}>
        {stopped ? (
          <span className={styles.stoppedLabel}>Нет в наличии</span>
        ) : (
          <span className={cx("name")}>{formatPrice(price)}</span>
        )}

        {stopped ? null : quantity > 0 ? (
          <div className={cx("stepper")}>
            <button
              type="button"
              className={cx("stepBtn")}
              onClick={() => onRemove(item)}
              aria-label={`Уменьшить количество «${name}»`}
            >
              −
            </button>
            <span className={cx("qty")}>{quantity}</span>
            <button
              type="button"
              className={cx("stepBtn")}
              onClick={() => onAdd(item)}
              aria-label={`Увеличить количество «${name}»`}
            >
              +
            </button>
          </div>
        ) : (
          <button
            type="button"
            className={cx("add")}
            onClick={() => onAdd(item)}
            aria-label={`Добавить «${name}» в корзину`}
          >
            +
          </button>
        )}
      </div>
    </div>
  );
}
