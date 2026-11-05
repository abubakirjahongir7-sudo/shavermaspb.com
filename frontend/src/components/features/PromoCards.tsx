"use client";

import Image from "next/image";
import { menuItems } from "@/data/menuItems";

function shortName(name: string) {
  const stripped = name.replace(/^Шаверма\s*/i, "");
  return stripped.charAt(0).toUpperCase() + stripped.slice(1);
}
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/utils";
import styles from "./PromoCards.module.css";

const BESTSELLERS = [
  { id: "sh-s-gribami", badge: "🔥 В тренде" },
  { id: "sh-mazhor", badge: "❤️ Для любителей" },
];

/**
 * Bosh sahifada LocationBar ostida ko'rinadigan reklama kartochkasi —
 * eng ko'p sotiladigan 2 ta pozitsiya.
 * TODO: kafe Yandex Kartadagi sahifasini bersa, "otziv uchun bonus"
 * kartochkasini qaytarish mumkin.
 */
export function PromoCards() {
  const { add, remove, quantityOf } = useCart();
  const bestsellers = BESTSELLERS.map((b) => ({
    ...b,
    item: menuItems.find((item) => item.id === b.id),
  })).filter(
    (b): b is typeof b & { item: NonNullable<typeof b.item> } => Boolean(b.item)
  );

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.bestsellerRow}>
          {bestsellers.map(({ id, badge, item }) => {
            const qty = quantityOf(item.id);
            return (
              <div key={id} className={styles.bestsellerItem}>
                <span className={styles.bestsellerBadge}>{badge}</span>
                <span className={styles.bestsellerMain}>
                  {item.image && (
                    <Image
                      src={item.image}
                      alt=""
                      width={64}
                      height={64}
                      className={styles.bestsellerImage}
                      unoptimized
                    />
                  )}
                  <span className={styles.bestsellerInfo}>
                    <span className={styles.bestsellerName}>{shortName(item.name)}</span>
                    <span className={styles.bestsellerPrice}>{formatPrice(item.price)}</span>
                  </span>

                  {qty > 0 ? (
                    <span className={styles.bestsellerStepper}>
                      <button
                        type="button"
                        className={styles.bestsellerStepBtn}
                        onClick={() => remove(item)}
                        aria-label={`Уменьшить количество «${item.name}»`}
                      >
                        −
                      </button>
                      <span className={styles.bestsellerQty}>{qty}</span>
                      <button
                        type="button"
                        className={styles.bestsellerStepBtn}
                        onClick={() => add(item)}
                        aria-label={`Увеличить количество «${item.name}»`}
                      >
                        +
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      className={styles.bestsellerAdd}
                      onClick={() => add(item)}
                      aria-label={`Добавить «${item.name}» в корзину`}
                    >
                      +
                    </button>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
