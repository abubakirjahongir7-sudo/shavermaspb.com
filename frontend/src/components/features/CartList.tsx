"use client";

import { categories, menuItems } from "@/data/menuItems";
import { useCart } from "@/hooks/useCart";
import { useStopList } from "@/hooks/useStopList";
import { useOrderStore } from "@/store/orderStore";
import { ProductCard } from "./ProductCard";
import { DrinkRow } from "./DrinkRow";
import styles from "./CartList.module.css";

/**
 * Menyuni toifalar (Шаверма, Горячее, Напитки, ...) bo'yicha bo'limlarga
 * ajratib, har birini savat holati (miqdorlar) bilan bog'lab ko'rsatadi.
 * Har bir toifa o'zining layout'iga ("grid" — rasmli kartochka,
 * "list" — ixcham qator) qarab render qilinadi. Kafe egasi "stop"ga
 * qo'ygan mahsulotlar ranssiz va savatga qo'shib bo'lmaydigan bo'lib
 * ko'rsatiladi — mijoz hozir tanlagan filialga qarab (har bir filial
 * o'z alohida stop-listiga ega).
 */
export function CartList() {
  const { quantityOf, add, remove } = useCart();
  const cafeId = useOrderStore((state) => state.cafeId);
  const stoppedIds = useStopList(cafeId);

  // Stop qo'yilgan mahsulotni savatga qo'shishning umuman iloji
  // bo'lmasin — UI ko'rinishidan tashqari, himoya sifatida ham.
  const handleAdd = (item: (typeof menuItems)[number]) => {
    if (stoppedIds.has(item.id)) return;
    add(item);
  };

  return (
    <>
      {categories.map((category) => {
        const items = menuItems.filter((item) => item.category === category.id);
        if (!items.length) return null;

        return (
          <section key={category.id} id={category.id} className={styles.section}>
            <h2 className={styles.sectionTitle}>{category.label}</h2>

            {category.layout === "list" ? (
              <div className={styles.list}>
                {items.map((item) => (
                  <DrinkRow
                    key={item.id}
                    item={item}
                    quantity={quantityOf(item.id)}
                    onAdd={handleAdd}
                    onRemove={remove}
                    accent={category.accent}
                    stopped={stoppedIds.has(item.id)}
                  />
                ))}
              </div>
            ) : (
              <div className={styles.grid}>
                {items.map((item) => (
                  <ProductCard
                    key={item.id}
                    item={item}
                    quantity={quantityOf(item.id)}
                    onAdd={handleAdd}
                    onRemove={remove}
                    stopped={stoppedIds.has(item.id)}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </>
  );
}
