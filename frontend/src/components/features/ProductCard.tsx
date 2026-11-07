"use client";

import Image from "next/image";
import type { MenuItem } from "@/data/menuItems";
import { formatPrice } from "@/lib/utils";
import styles from "./ProductCard.module.css";

interface ProductCardProps {
  item: MenuItem;
  quantity: number;
  onAdd: (item: MenuItem) => void;
  onRemove: (item: MenuItem) => void;
  stopped?: boolean;
}

export function ProductCard({ item, quantity, onAdd, onRemove, stopped }: ProductCardProps) {
  // Tarkibni ochadigan strelka hozircha kerak emas — kartada faqat nom va narx.
  const { name, weight, price, image } = item;

  return (
    <article
      className={`${styles.card} ${stopped ? styles.stopped : ""}`}
      data-item-id={item.id}
    >
      <div className={`${styles.imageWrap} ${image ? "" : styles.noImage}`}>
        {image && (
          <Image
            className={styles.image}
            src={image}
            alt={name}
            fill
            sizes="(max-width: 480px) 50vw, 220px"
          />
        )}
        {stopped && <span className={styles.stoppedBadge}>Нет в наличии</span>}
      </div>

      <div className={styles.body}>
        <div className={styles.nameRow}>
          <h3 className={styles.name}>{name}</h3>{" "}
          <span className={styles.weight}>{weight}</span>
        </div>

        <div className={styles.footer}>
          <div className={styles.priceBlock}>
            <span className={styles.price}>{formatPrice(price)}</span>
          </div>

          {stopped ? null : quantity > 0 ? (
            <div className={styles.stepper}>
              <button
                type="button"
                className={styles.stepBtn}
                onClick={() => onRemove(item)}
                aria-label={`Уменьшить количество «${name}»`}
              >
                −
              </button>
              <span className={styles.qty}>{quantity}</span>
              <button
                type="button"
                className={styles.stepBtn}
                onClick={() => onAdd(item)}
                aria-label={`Увеличить количество «${name}»`}
              >
                +
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={styles.add}
              onClick={() => onAdd(item)}
              aria-label={`Добавить «${name}» в корзину`}
            >
              +
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
