"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchTrackedOrder, type OrderStatus, type TrackedOrder } from "@/lib/api";
import { findCafe } from "@/data/cafes";
import { formatPrice } from "@/lib/utils";
import { useOrderPush } from "@/hooks/useOrderPush";
import { useMyOrdersStore } from "@/store/myOrdersStore";
import type { PushStatus } from "@/lib/push";
import styles from "./OrderStatusPage.module.css";

const POLL_MS = 5000;
const FINAL_STATUSES: OrderStatus[] = ["DELIVERED", "CANCELLED"];

interface Step {
  status: OrderStatus;
  label: string;
}

function stepsFor(order: TrackedOrder): Step[] {
  const steps: Step[] = [
    { status: "PENDING", label: "Заказ отправлен" },
    { status: "CONFIRMED", label: "Принят — готовим" },
    {
      status: "READY",
      label: order.orderType === "DELIVERY" ? "Готов — передаём курьеру" : "Готов — можно забирать",
    },
  ];
  if (order.orderType === "DELIVERY") {
    steps.push({ status: "OUT_FOR_DELIVERY", label: "Курьер в пути" });
    steps.push({ status: "DELIVERED", label: "Доставлен" });
  }
  return steps;
}

const PUSH_TEXT: Partial<Record<PushStatus, string>> = {
  off: "🔔 Сообщить, когда заказ будет готов",
  error: "⚠️ Не удалось включить уведомления — попробовать снова",
  on: "🔔 Уведомим вас, когда статус заказа изменится",
  denied: "🔕 Уведомления запрещены — разрешите их в настройках телефона",
  "needs-install":
    "📲 Чтобы получать уведомления на iPhone: «Поделиться» → «На экран „Домой“», затем откройте приложение оттуда",
};

function PushBlock({ orderId, token }: { orderId: number; token: string }) {
  const { status, enable } = useOrderPush(orderId, token);
  const text = PUSH_TEXT[status];
  if (!text) return null;

  if (status === "off" || status === "error") {
    return (
      <button type="button" className={styles.pushBtn} onClick={enable}>
        {text}
      </button>
    );
  }
  return <p className={styles.pushNote}>{text}</p>;
}

interface OrderStatusPageProps {
  orderId: number;
  token: string;
}

/**
 * Mijozning o'z buyurtmasi holati — server har 5 soniyada so'raladi va
 * "Отправлен → Принят → Готов" qadamlari jonli yangilanadi.
 */
export function OrderStatusPage({ orderId, token: tokenFromUrl }: OrderStatusPageProps) {
  const router = useRouter();
  const savedOrders = useMyOrdersStore((s) => s.orders);
  const addOrder = useMyOrdersStore((s) => s.addOrder);
  const token = tokenFromUrl || savedOrders.find((o) => o.id === orderId)?.token || "";

  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!token || !Number.isInteger(orderId)) {
      setNotFound(true);
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const load = async () => {
      try {
        const result = await fetchTrackedOrder(orderId, token);
        if (cancelled) return;
        if (!result) {
          setNotFound(true);
          return;
        }
        setOrder(result);
        addOrder({ id: result.id, token, createdAt: result.createdAt });
        if (FINAL_STATUSES.includes(result.status)) return;
      } catch {
        // Vaqtincha tarmoq xatosi — keyingi urinishda o'zi tuzaladi.
      }
      timer = setTimeout(load, POLL_MS);
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        clearTimeout(timer);
        load();
      }
    };

    load();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [orderId, token, addOrder]);

  const goToMenu = () => router.push("/");

  if (notFound) {
    return (
      <div className={styles.page}>
        <div className={styles.center}>
          <span className={styles.bigIcon}>🤷</span>
          <h1 className={styles.title}>Заказ не найден</h1>
          <button type="button" className={styles.menuBtn} onClick={goToMenu}>
            Вернуться в меню
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className={styles.page}>
        <div className={styles.center}>
          <p className={styles.muted}>Загружаем заказ…</p>
        </div>
      </div>
    );
  }

  const cancelled = order.status === "CANCELLED";
  const awaitingPayment = order.paymentStatus === "PENDING";
  const paymentLabel =
    order.paymentMethod === "CASH"
      ? "наличными"
      : order.paymentStatus === "PAID"
        ? "оплачено картой"
        : order.paymentStatus === "REFUNDED"
          ? "деньги возвращены"
          : "картой";
  const steps = stepsFor(order);
  const currentIndex = steps.findIndex((s) => s.status === order.status);
  const where =
    order.orderType === "DELIVERY"
      ? `🚚 Доставка: ${order.address ?? "—"}`
      : `🏠 Самовывоз: ${findCafe(order.cafeId ?? "")?.name ?? "—"}`;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button type="button" className={styles.back} onClick={goToMenu} aria-label="В меню">
          ←
        </button>
        <h1 className={styles.headerTitle}>Заказ #{order.id}</h1>
      </header>

      <div className={styles.content}>
        <section className={styles.card}>
          {cancelled ? (
            <div className={styles.cancelled}>
              <span className={styles.bigIcon}>❌</span>
              <p className={styles.cancelledText}>Заказ отменён</p>
              <p className={styles.muted}>
                {order.paymentStatus === "REFUNDED"
                  ? "Деньги вернутся на вашу карту."
                  : order.paymentStatus === "CANCELED"
                    ? "Оплата не прошла, деньги не списаны."
                    : "Если это ошибка — позвоните в кафе."}
              </p>
            </div>
          ) : awaitingPayment ? (
            <div className={styles.cancelled}>
              <span className={styles.bigIcon}>💳</span>
              <p className={styles.cancelledText}>Ожидаем оплату</p>
              <p className={styles.muted}>Кафе начнёт готовить сразу после оплаты.</p>
            </div>
          ) : (
            <ol className={styles.steps}>
              {steps.map((step, i) => {
                const state = i < currentIndex ? "done" : i === currentIndex ? "current" : "todo";
                return (
                  <li key={step.status} className={`${styles.step} ${styles[state]}`}>
                    <span className={styles.dot}>{state === "done" ? "✓" : i + 1}</span>
                    <span className={styles.stepLabel}>{step.label}</span>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        {awaitingPayment && order.paymentUrl && (
          <a className={styles.pushBtn} href={order.paymentUrl}>
            💳 Перейти к оплате — {formatPrice(order.total)}
          </a>
        )}

        {!FINAL_STATUSES.includes(order.status) && !awaitingPayment && (
          <PushBlock orderId={order.id} token={token} />
        )}

        <section className={styles.card}>
          <p className={styles.where}>{where}</p>
          <ul className={styles.items}>
            {order.items.map((item) => (
              <li key={item.id} className={styles.item}>
                <span>
                  {item.name} × {item.quantity}
                  {item.comment && <span className={styles.comment}>💬 {item.comment}</span>}
                </span>
                <span>{formatPrice(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
          {order.deliveryFee > 0 && (
            <div className={styles.item}>
              <span>Доставка</span>
              <span>{formatPrice(order.deliveryFee)}</span>
            </div>
          )}
          <div className={styles.total}>
            <span>Итого · {paymentLabel}</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </section>

        <button type="button" className={styles.menuBtn} onClick={goToMenu}>
          Вернуться в меню
        </button>
      </div>
    </div>
  );
}
