"use client";

import { useEffect, useState } from "react";
import { categories, menuItems } from "@/data/menuItems";
import { fetchStopList, stopMenuItem, unstopMenuItem } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import styles from "./MenuStopList.module.css";

// "Добавки" katalogda yo'q, lekin savatda bor — ularni ham stop qilish mumkin.
const stopListCategories = [...categories, { id: "dobavki", label: "Добавки" }];

interface MenuStopListProps {
  password: string;
  cafeId: string;
}

/**
 * Admin panel — "Меню" bo'limi. Kafe egasi biror mahsulot shu filialda
 * tugab qolsa, shu yerdan "Стоп" bosadi — mahsulot faqat shu filialning
 * mijoz ekranida ranssiz va bloklangan bo'lib qoladi (boshqa filiallarga
 * ta'sir qilmaydi). "Вернуть" bosilsa — asl holatiga qaytadi.
 */
export function MenuStopList({ password, cafeId }: MenuStopListProps) {
  const [stoppedIds, setStoppedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchStopList(cafeId).then((ids) => {
      if (!cancelled) {
        setStoppedIds(new Set(ids));
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [cafeId]);

  const handleToggle = async (itemId: string) => {
    setPendingId(itemId);
    setError("");
    const isStopped = stoppedIds.has(itemId);

    try {
      if (isStopped) {
        await unstopMenuItem(password, cafeId, itemId);
        setStoppedIds((prev) => {
          const next = new Set(prev);
          next.delete(itemId);
          return next;
        });
      } else {
        await stopMenuItem(password, cafeId, itemId);
        setStoppedIds((prev) => new Set(prev).add(itemId));
      }
    } catch {
      setError("Не удалось изменить статус товара");
    } finally {
      setPendingId(null);
    }
  };

  if (loading) {
    return <p className={styles.empty}>Загрузка…</p>;
  }

  return (
    <div className={styles.wrap}>
      {error && <p className={styles.error}>{error}</p>}

      {stopListCategories.map((category) => {
        const items = menuItems.filter((item) => item.category === category.id);
        if (!items.length) return null;

        return (
          <section key={category.id} className={styles.section}>
            <h2 className={styles.sectionTitle}>{category.label}</h2>
            <div className={styles.items}>
              {items.map((item) => {
                const isStopped = stoppedIds.has(item.id);
                return (
                  <div
                    key={item.id}
                    className={`${styles.item} ${isStopped ? styles.itemStopped : ""}`}
                  >
                    <span className={styles.itemInfo}>
                      <span className={styles.itemName}>{item.name}</span>
                      <span className={styles.itemPrice}>{formatPrice(item.price)}</span>
                    </span>
                    <button
                      type="button"
                      className={isStopped ? styles.restoreBtn : styles.stopBtn}
                      onClick={() => handleToggle(item.id)}
                      disabled={pendingId === item.id}
                    >
                      {isStopped ? "↩ Вернуть" : "⛔ Стоп"}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
