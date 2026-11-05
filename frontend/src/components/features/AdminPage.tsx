"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  API_BASE_URL,
  fetchAdminOrders,
  updateAdminOrderStatus,
  requestCourier,
  cancelCourier,
  CourierError,
  type AdminOrder,
  type OrderStatus,
} from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { CAFES, findCafe } from "@/data/cafes";
import { Header } from "@/components/layout/Header";
import { getShiftCutoff, SHIFT_START_HOUR } from "@/lib/shiftCutoff";
import { useAdminPush, type AdminPushStatus } from "@/hooks/useAdminPush";
import { MenuStopList } from "./MenuStopList";
import styles from "./AdminPage.module.css";

const RINGTONE_SRC = "/sounds/notification.m4a";

const STORAGE_KEY = "admin_password";
// Qurilma qaysi kafeda turishini eslab qolish uchun (har bir filialda
// alohida planshet/telefon bo'ladi — u doim o'z kafesini ko'rsatishi kerak).
const CAFE_STORAGE_KEY = "admin_cafe_id";
// Yangi buyurtmalarni avtomatik olib turish uchun so'rov oralig'i.
const POLL_INTERVAL_MS = 5000;

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "🆕 Новый",
  CONFIRMED: "✅ Принят",
  READY: "🍽 Готов",
  OUT_FOR_DELIVERY: "🛵 В пути",
  DELIVERED: "🚚 Доставлен",
  CANCELLED: "❌ Отменён",
};

const PICKUP_STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED", "READY", "DELIVERED", "CANCELLED"];
const DELIVERY_STATUSES: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
];

// Yandex Доставка holatlari — ro'yxatda yo'q bo'lsa "Курьер: holat" chiqadi.
const COURIER_LABELS: Record<string, string> = {
  new: "оформляем заявку",
  estimating: "оформляем заявку",
  ready_for_approval: "оформляем заявку",
  accepted: "ищем курьера",
  performer_lookup: "ищем курьера",
  performer_draft: "ищем курьера",
  performer_found: "едет в кафе",
  pickup_arrived: "ждёт в кафе",
  ready_for_pickup_confirmation: "ждёт код в кафе",
  pickuped: "везёт заказ",
  delivery_arrived: "у клиента",
  ready_for_delivery_confirmation: "у клиента",
  delivered: "доставил",
  delivered_finish: "доставил",
  returning: "возвращает заказ в кафе",
  return_arrived: "возвращает заказ в кафе",
  ready_for_return_confirmation: "возвращает заказ в кафе",
  returned: "вернул заказ",
  returned_finish: "вернул заказ",
  performer_not_found: "не найден",
  estimating_failed: "заявка не прошла",
  failed: "ошибка доставки",
  cancelled: "отменён",
  cancelled_with_payment: "отменён платно",
  cancelled_by_taxi: "отменён Яндексом",
  cancelled_with_items_on_hands: "отменён, заказ у курьера",
};

const COURIER_FINAL = new Set([
  "estimating_failed",
  "performer_not_found",
  "delivered",
  "delivered_finish",
  "returned_finish",
  "failed",
  "cancelled",
  "cancelled_with_payment",
  "cancelled_by_taxi",
  "cancelled_with_items_on_hands",
]);

function courierActive(order: AdminOrder) {
  return Boolean(order.courierClaimId) && !COURIER_FINAL.has(order.courierStatus ?? "");
}

function paymentLabel(order: AdminOrder) {
  if (order.paymentMethod === "CASH") {
    return "💵 Наличными";
  }
  return order.paymentStatus === "REFUNDED" ? "↩️ Деньги возвращены" : "💳 Оплачено картой";
}

// Push holatiga mos banner matni (null — banner ko'rsatilmaydi).
const PUSH_BANNER_TEXT: Partial<Record<AdminPushStatus, string>> = {
  off: "🔔 Включите уведомления — заказы будут приходить, даже когда телефон заблокирован",
  error: "⚠️ Не удалось включить уведомления — нажмите, чтобы попробовать снова",
  denied: "🔕 Уведомления запрещены — разрешите их в настройках телефона для этого приложения",
  "needs-install":
    "📲 Для уведомлений на iPhone: «Поделиться» → «На экран „Домой“», затем откройте админку оттуда",
};

function customerLabel(order: AdminOrder) {
  const name = order.customerName || "—";
  return order.phone ? `${name} · 📞 ${order.phone}` : name;
}

function fulfillmentLabel(order: AdminOrder) {
  if (order.orderType === "DELIVERY") {
    return `🚚 Доставка: ${order.address || "—"}`;
  }
  const cafe = findCafe(order.cafeId);
  return `🏠 Самовывоз: ${cafe?.name ?? order.cafeId ?? "—"}`;
}

interface AdminPageProps {
  // Berilganda — panel faqat shu filialga "qulflanadi": filial almashtirish
  // tugmalari umuman ko'rsatilmaydi, boshqa hech narsa o'zgarmaydi. Har bir
  // manzil uchun alohida bot/admin-panel kerak bo'lganda ishlatiladi
  // (masalan /admin).
  lockedCafeId?: string;
}

/**
 * Admin panel — parol bilan himoyalangan sahifa. Buyurtmalar ro'yxatini
 * ko'rsatadi va har birining holatini o'zgartirish imkonini beradi.
 */
export function AdminPage({ lockedCafeId }: AdminPageProps = {}) {
  const [password, setPassword] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cafeId, setCafeId] = useState(lockedCafeId ?? CAFES[0].id);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [view, setView] = useState<"orders" | "menu">("orders");
  // Brauzer avtoplay siyosati rington chalishni rad etsa (masalan sahifa
  // qayta yuklangandan keyin hali hech qanday bosish bo'lmagan bo'lsa) —
  // buni jim yutib yubormasdan, ko'rinadigan banner bilan bildiramiz.
  const [soundBlocked, setSoundBlocked] = useState(false);
  // Rington elementi — "Новый" statusdagi buyurtma bo'lar ekan, davomli
  // (loop) chalinadi, "Принять" bosilib hammasi qabul qilingach to'xtaydi.
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  // Kafe monitoriga doimiy ochiq qo'yiladigan panel uchun — ekran
  // avtomatik o'chib/qulflanib qolmasin (aks holda yangi buyurtma
  // kelganda ko'rinmay qolishi mumkin).
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  // Web Push — PWA yopiq yoki telefon uyquda bo'lsa ham shu filial
  // buyurtmalari haqida tizim bildirishnomasi.
  const push = useAdminPush(password, cafeId);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setPassword(stored);

    // Qulflangan panelda saqlangan qiymatga qaramaymiz — doim o'ziga
    // tegishli bitta filialni ko'rsatadi.
    if (lockedCafeId) return;
    const storedCafe = localStorage.getItem(CAFE_STORAGE_KEY);
    if (storedCafe && CAFES.some((c) => c.id === storedCafe)) setCafeId(storedCafe);
  }, [lockedCafeId]);

  // Brauzer autoplay siyosati: ovoz faqat haqiqiy foydalanuvchi
  // harakatidan keyin ruxsat etiladi. Parol avvalroq saqlangan bo'lsa,
  // login formasi (va "Войти" bosilishi) umuman ko'rinmaydi — shuning
  // uchun sahifadagi birinchi istalgan bosishda ham "ochib" qo'yamiz
  // (play()+darhol pause() — standart "audio unlock" usuli).
  useEffect(() => {
    const handleFirstInteraction = () => {
      unlockRingtone();
      document.removeEventListener("pointerdown", handleFirstInteraction);
    };
    document.addEventListener("pointerdown", handleFirstInteraction);
    return () => document.removeEventListener("pointerdown", handleFirstInteraction);
  }, []);

  function unlockRingtone() {
    const audio = ringtoneRef.current;
    if (!audio) return;
    audio
      .play()
      .then(() => {
        audio.pause();
        audio.currentTime = 0;
      })
      .catch(() => {});
  }

  const handleCafeChange = (id: string) => {
    setCafeId(id);
    localStorage.setItem(CAFE_STORAGE_KEY, id);
  };

  const load = useCallback(async (pwd: string, opts: { silent?: boolean } = {}) => {
    const { silent = false } = opts;
    if (!silent) setLoading(true);
    setError("");
    try {
      const data = await fetchAdminOrders(pwd);
      setOrders(data);
    } catch (err) {
      if (err instanceof Error && err.message === "UNAUTHORIZED") {
        setError("Неверный пароль");
        setPassword(null);
        localStorage.removeItem(STORAGE_KEY);
      } else if (!silent) {
        // Fon rejimidagi (avtomatik) so'rov bir marta muvaffaqiyatsiz
        // bo'lsa ham xato bannerini ko'rsatmaymiz — keyingi so'rovda
        // o'zi tuzaladi. Foydalanuvchi bosgan "Обновить" esa xatoni ko'rsatadi.
        setError("Не удалось загрузить заказы");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (password) load(password);
  }, [password, load]);

  // Mijoz qaysi filialdan buyurtma bersa ham, admin panel ochiq turgan
  // paytda avtomatik yangilanib tursin — "Обновить"ni qo'lda bosishga
  // hojat qolmasin.
  useEffect(() => {
    if (!password) return;
    const interval = setInterval(() => {
      load(password, { silent: true });
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [password, load]);

  // Planshet/telefon ekrani o'chib-yonganda yoki ilova fonga o'tib
  // qaytganda navbatdagi pollingni kutmasdan darhol yangilaymiz.
  useEffect(() => {
    if (!password) return;
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        load(password, { silent: true });
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [password, load]);

  // Real-vaqtda yangilanish: backend yangi buyurtma kelganda shu ulanish
  // orqali signal yuboradi (telefonda fondagi setInterval
  // sekinlashishi/to'xtashi mumkin — SSE bunga bog'liq emas, chunki bu
  // taymerga emas, ochiq HTTP ulanishga asoslangan). Yuqoridagi 5s
  // polling — agar SSE ulanishi biror sababga ko'ra uzilib qolsa, zaxira
  // sifatida saqlanadi.
  useEffect(() => {
    if (!password || !API_BASE_URL || typeof EventSource === "undefined") return;

    const url = `${API_BASE_URL}/api/admin/orders/stream?token=${encodeURIComponent(password)}`;
    const source = new EventSource(url);

    source.addEventListener("new-order", () => {
      load(password, { silent: true });
    });

    return () => source.close();
  }, [password, load]);

  // Ekranni "uyg'oq" ushlab turish (Screen Wake Lock API) — kafeda
  // devor/pult monitoriga qo'yilgan planshet/kompyuter doim ochiq turishi
  // kerak, aks holda ekran o'chib qolsa yangi buyurtma va rington
  // ko'rinmay/eshitilmay qolishi mumkin. Qo'llab-quvvatlamaydigan
  // brauzerlarda yoki ruxsat berilmasa — jim o'tkazib yuboriladi (panel
  // baribir ishlayveradi, faqat ekran o'z-o'zidan o'chishi mumkin).
  useEffect(() => {
    if (!password || typeof navigator === "undefined" || !("wakeLock" in navigator)) return;

    let cancelled = false;

    const requestWakeLock = async () => {
      try {
        const lock = await navigator.wakeLock.request("screen");
        if (cancelled) {
          lock.release().catch(() => {});
          return;
        }
        wakeLockRef.current = lock;
      } catch {
        // Masalan sahifa fonda bo'lganda so'ralsa rad etiladi — keyingi
        // marta ko'rinadigan bo'lganda qayta urinib ko'ramiz.
      }
    };

    requestWakeLock();

    // Wake lock brauzer tomonidan sahifa fonga o'tganda avtomatik
    // bo'shatiladi — qaytib ko'ringanda qayta so'raymiz.
    const handleVisibility = () => {
      if (document.visibilityState === "visible") requestWakeLock();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibility);
      wakeLockRef.current?.release().catch(() => {});
      wakeLockRef.current = null;
    };
  }, [password]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) return;
    // Haqiqiy foydalanuvchi harakati ("Войти" bosilishi) — shu yerda
    // ringtonni "ochib" qo'yamiz, shundan keyin keyingi bildirishnomalar
    // (SSE orqali, bosishsiz) ham ovoz chiqara oladi.
    unlockRingtone();
    localStorage.setItem(STORAGE_KEY, passwordInput);
    setPassword(passwordInput);
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setPassword(null);
    setOrders([]);
  };

  const handleStatusChange = async (order: AdminOrder, status: OrderStatus) => {
    if (!password) return;
    if (
      status === "CANCELLED" &&
      order.paymentStatus === "PAID" &&
      !window.confirm(`Отменить заказ #${order.id} и вернуть клиенту ${formatPrice(order.total)}?`)
    ) {
      return;
    }
    try {
      setError("");
      const updated = await updateAdminOrderStatus(password, order.id, status);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    } catch {
      setError(
        status === "CANCELLED" && courierActive(order)
          ? "Сначала отмените курьера"
          : status === "CANCELLED" && order.paymentStatus === "PAID"
            ? "Не удалось вернуть деньги — заказ не отменён"
            : "Не удалось изменить статус заказа"
      );
    }
  };

  const replaceOrder = (updated: AdminOrder) =>
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));

  const handleRequestCourier = async (order: AdminOrder) => {
    if (!password) return;
    try {
      setError("");
      replaceOrder(await requestCourier(password, order.id));
    } catch {
      setError("Не удалось вызвать курьера. Попробуйте ещё раз.");
    }
  };

  const handleCancelCourier = async (order: AdminOrder) => {
    if (!password || !window.confirm(`Отменить курьера для заказа #${order.id}?`)) return;
    try {
      setError("");
      replaceOrder(await cancelCourier(password, order.id));
    } catch (err) {
      if (err instanceof CourierError && err.code === "CANCEL_PAID") {
        if (!window.confirm(`Курьер уже в пути. Отмена платная: ${err.price} ₽. Отменить?`)) return;
        try {
          replaceOrder(await cancelCourier(password, order.id, true));
        } catch {
          setError("Не удалось отменить курьера");
        }
        return;
      }
      setError(
        err instanceof CourierError && err.code === "CANCEL_UNAVAILABLE"
          ? "Курьера уже нельзя отменить. Обратитесь в поддержку Яндекс Доставки."
          : "Не удалось отменить курьера"
      );
    }
  };

  const shiftCutoff = getShiftCutoff();
  const filteredOrders = orders
    .filter((o) => o.cafeId === cafeId)
    .filter((o) => showAllHistory || new Date(o.createdAt) >= shiftCutoff);

  // Shu filialda hali "Принять" bosilmagan ("Новый") buyurtma bor ekan —
  // rington davomli (loop) chalinaveradi. Hammasi qabul qilingach o'zi
  // to'xtaydi — buyurtmani o'tkazib yubormaslik uchun shunday qilingan.
  const hasPending = filteredOrders.some((o) => o.status === "PENDING");

  useEffect(() => {
    const audio = ringtoneRef.current;
    if (!audio) return;
    if (hasPending) {
      audio
        .play()
        .then(() => setSoundBlocked(false))
        .catch(() => setSoundBlocked(true));
    } else {
      audio.pause();
      audio.currentTime = 0;
      setSoundBlocked(false);
    }
  }, [hasPending]);

  // Rington avtoplay tomonidan bloklangan ekan — ekrandagi keyingi
  // istalgan bosishda qayta urinib ko'ramiz (foydalanuvchi banner'ni
  // yoki istalgan boshqa joyni bossa ham ishlaydi).
  useEffect(() => {
    if (!soundBlocked) return;
    const audio = ringtoneRef.current;
    const retry = () => {
      audio
        ?.play()
        .then(() => setSoundBlocked(false))
        .catch(() => {});
    };
    document.addEventListener("pointerdown", retry);
    return () => document.removeEventListener("pointerdown", retry);
  }, [soundBlocked]);

  if (!password) {
    return (
      <>
      <Header showSupport={false} />
      <div className={styles.loginWrap}>
        <form className={styles.loginCard} onSubmit={handleLogin}>
          <h1 className={styles.loginTitle}>Админ-панель</h1>
          <input
            type="password"
            className={styles.input}
            placeholder="Пароль"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            autoFocus
          />
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className={styles.submitBtn}>
            Войти
          </button>
        </form>
      </div>
      </>
    );
  }

  return (
    <>
    <Header showSupport={false} />
    <div className={styles.page}>
      <audio ref={ringtoneRef} src={RINGTONE_SRC} loop preload="auto" />

      {hasPending && (
        <p className={styles.ringingBanner}>🔔 Новый заказ — нажмите «Принять»</p>
      )}
      {hasPending && soundBlocked && (
        <p className={styles.soundBlockedBanner}>
          🔇 Звук заблокирован браузером — нажмите здесь, чтобы включить
        </p>
      )}

      {PUSH_BANNER_TEXT[push.status] &&
        (push.status === "off" || push.status === "error" ? (
          <button type="button" className={styles.pushBanner} onClick={push.enable}>
            {PUSH_BANNER_TEXT[push.status]}
          </button>
        ) : (
          <p className={styles.pushBanner}>{PUSH_BANNER_TEXT[push.status]}</p>
        ))}

      <div className={styles.header}>
        <h1 className={styles.title}>
          {view === "orders" ? "Заказы" : "Меню"}
          {lockedCafeId && (
            <span className={styles.lockedCafeLabel}> · {findCafe(lockedCafeId)?.name}</span>
          )}
        </h1>
        <div className={styles.headerActions}>
          {view === "orders" && (
            <button type="button" className={styles.smallBtn} onClick={() => load(password)}>
              {loading ? "..." : "Обновить"}
            </button>
          )}
          <button type="button" className={styles.smallBtn} onClick={handleLogout}>
            Выйти
          </button>
        </div>
      </div>

      <div className={styles.viewTabs}>
        <button
          type="button"
          className={`${styles.viewTab} ${view === "orders" ? styles.viewTabActive : ""}`}
          onClick={() => setView("orders")}
        >
          📋 Заказы
        </button>
        <button
          type="button"
          className={`${styles.viewTab} ${view === "menu" ? styles.viewTabActive : ""}`}
          onClick={() => setView("menu")}
        >
          🍽 Меню
        </button>
      </div>

      {!lockedCafeId && (
        <div className={styles.cafeTabs}>
          {CAFES.map((cafe) => (
            <button
              key={cafe.id}
              type="button"
              className={`${styles.cafeTab} ${cafeId === cafe.id ? styles.cafeTabActive : ""}`}
              onClick={() => handleCafeChange(cafe.id)}
            >
              {cafe.name}
            </button>
          ))}
        </div>
      )}

      {view === "menu" ? (
        <MenuStopList password={password} cafeId={cafeId} />
      ) : (
        <>
          <div className={styles.historyToggle}>
            <span className={styles.historyLabel}>
              {showAllHistory ? "Вся история" : `Сегодня (с ${SHIFT_START_HOUR}:00)`}
            </span>
            <button
              type="button"
              className={styles.historyBtn}
              onClick={() => setShowAllHistory((v) => !v)}
            >
              {showAllHistory ? "Только сегодня" : "Вся история"}
            </button>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          {filteredOrders.length === 0 ? (
        <p className={styles.empty}>Заказов пока нет.</p>
      ) : (
        <div className={styles.orders}>
          {filteredOrders.map((order) => (
            <div key={order.id} className={styles.order}>
              <div className={styles.orderTop}>
                <span className={styles.orderId}>Заказ #{order.id}</span>
                <span className={styles.orderTime}>
                  {new Date(order.createdAt).toLocaleString("ru-RU")}
                </span>
              </div>
              <div className={styles.customer}>Клиент: {customerLabel(order)}</div>
              <div className={styles.customer}>{fulfillmentLabel(order)}</div>
              {order.orderType === "DELIVERY" && order.latitude != null && order.longitude != null && (
                <a
                  className={styles.mapLink}
                  href={`https://yandex.ru/maps/?pt=${order.longitude},${order.latitude}&z=16&l=map`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  🗺 Открыть на карте
                </a>
              )}
              <div className={styles.customer}>{paymentLabel(order)}</div>
              {order.courierClaimId && (
                <div className={styles.customer}>
                  🛵 Курьер{order.courierName ? ` ${order.courierName}` : ""}:{" "}
                  {COURIER_LABELS[order.courierStatus ?? ""] ?? order.courierStatus}
                </div>
              )}
              {order.orderType === "DELIVERY" &&
                order.paymentStatus === "PAID" &&
                (order.status === "CONFIRMED" || order.status === "READY") &&
                !courierActive(order) && (
                  <button
                    type="button"
                    className={styles.acceptBtn}
                    onClick={() => handleRequestCourier(order)}
                  >
                    🛵 Вызвать курьера
                  </button>
                )}
              {courierActive(order) && (
                <button
                  type="button"
                  className={styles.smallBtn}
                  onClick={() => handleCancelCourier(order)}
                >
                  Отменить курьера
                </button>
              )}
              <div className={styles.items}>
                {order.items.map((item) => (
                  <span key={item.id}>
                    {item.name} × {item.quantity} — {formatPrice(item.price * item.quantity)}
                    {item.comment && <span className={styles.itemComment}> · 💬 {item.comment}</span>}
                  </span>
                ))}
              </div>
              <div className={styles.orderFooter}>
                <span className={styles.total}>
                  Итого: {formatPrice(order.total)}
                  {order.deliveryFee > 0 && ` (доставка ${formatPrice(order.deliveryFee)})`}
                </span>
                <div className={styles.statusControls}>
                  {order.status === "PENDING" && (
                    <button
                      type="button"
                      className={styles.acceptBtn}
                      onClick={() => handleStatusChange(order, "CONFIRMED")}
                    >
                      ✅ Принять
                    </button>
                  )}
                  <select
                    className={styles.statusSelect}
                    value={order.status}
                    onChange={(e) => handleStatusChange(order, e.target.value as OrderStatus)}
                  >
                    {(order.orderType === "DELIVERY" ? DELIVERY_STATUSES : PICKUP_STATUSES).map((status) => (
                      <option key={status} value={status}>
                        {STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
            </div>
          )}
        </>
      )}
    </div>
    </>
  );
}
