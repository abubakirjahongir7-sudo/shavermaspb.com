"use client";

import { useCart } from "@/hooks/useCart";
import { menuItems } from "@/data/menuItems";
import { formatPrice } from "@/lib/utils";
import styles from "./AddDobavkiSheet.module.css";

interface AddDobavkiSheetProps {
  open: boolean;
  onClose: () => void;
}

const dobavki = menuItems.filter((item) => item.category === "dobavki");

/** Menyuda qo'shimchalar bo'lmasa, savatdagi "Добавки" tugmasi ko'rsatilmaydi. */
export const hasDobavki = dobavki.length > 0;

/**
 * Savat sahifasidan chiqmasdan "Добавки" (Лаваш, Сыр va h.k.) qo'shish
 * uchun pastdan chiqadigan katalog — AddressSheet bilan bir xil
 * overlay/sheet naqshi asosida.
 */
export function AddDobavkiSheet({ open, onClose }: AddDobavkiSheetProps) {
  const { quantityOf, add, remove } = useCart();

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Добавки</h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </div>

        <div className={styles.list}>
          {dobavki.map((item) => {
            const qty = quantityOf(item.id);
            return (
              <div key={item.id} className={styles.itemRow}>
                <div className={styles.itemInfo}>
                  <span className={styles.itemName}>{item.name}</span>
                  <span className={styles.itemPrice}>{formatPrice(item.price)}</span>
                </div>

                <div className={styles.control}>
                {qty > 0 ? (
                  <div className={styles.stepper}>
                    <button
                      type="button"
                      className={styles.stepBtn}
                      onClick={() => remove(item)}
                      aria-label={`Уменьшить количество «${item.name}»`}
                    >
                      −
                    </button>
                    <span className={styles.qty}>{qty}</span>
                    <button
                      type="button"
                      className={styles.stepBtn}
                      onClick={() => add(item)}
                      aria-label={`Увеличить количество «${item.name}»`}
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <button type="button" className={styles.addBtn} onClick={() => add(item)}>
                    Добавить
                  </button>
                )}
                </div>
              </div>
            );
          })}
        </div>

        <button type="button" className={styles.doneBtn} onClick={onClose}>
          Готово
        </button>
      </div>
    </div>
  );
}
