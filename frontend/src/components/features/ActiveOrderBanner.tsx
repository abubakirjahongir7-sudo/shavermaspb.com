"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchTrackedOrder, type OrderStatus } from "@/lib/api";
import { useMyOrdersStore } from "@/store/myOrdersStore";
import styles from "./ActiveOrderBanner.module.css";

const STATUS_TEXT: Partial<Record<OrderStatus, string>> = {
  PENDING: "отправлен в кафе",
  CONFIRMED: "принят — готовим",
  READY: "готов!",
};

// Bir kundan eski buyurtma uchun bannerni ko'rsatib o'tirmaymiz.
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

/** Bosh sahifada — mijozning hali yakunlanmagan oxirgi buyurtmasi. */
export function ActiveOrderBanner() {
  const latest = useMyOrdersStore((s) => s.orders[0]);
  const [status, setStatus] = useState<OrderStatus | null>(null);

  useEffect(() => {
    if (!latest || Date.now() - new Date(latest.createdAt).getTime() > MAX_AGE_MS) return;
    let cancelled = false;
    fetchTrackedOrder(latest.id, latest.token)
      .then((order) => {
        if (!cancelled) setStatus(order?.status ?? null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [latest]);

  const text = status && STATUS_TEXT[status];
  if (!latest || !text) return null;

  return (
    <Link
      href={`/order/${latest.id}?t=${encodeURIComponent(latest.token)}`}
      className={`${styles.banner} ${status === "READY" ? styles.ready : ""}`}
    >
      <span className={styles.icon}>{status === "READY" ? "🍽" : "⏳"}</span>
      <span className={styles.text}>
        Заказ #{latest.id} {text}
      </span>
      <span className={styles.arrow}>→</span>
    </Link>
  );
}
