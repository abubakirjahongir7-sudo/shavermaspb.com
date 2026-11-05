"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/hooks/useCart";
import { useOrderStore } from "@/store/orderStore";
import { useCustomerStore } from "@/store/customerStore";
import { useMyOrdersStore } from "@/store/myOrdersStore";
import { findCafe } from "@/data/cafes";
import {
  fetchCheckoutConfig,
  submitOrder,
  OrderRejectedError,
  type CheckoutConfig,
  type PaymentMethod,
} from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { findPublishedLegalDoc } from "@/data/legal";
import Link from "next/link";
import { AddressSheet } from "./AddressSheet";
import { LegalLinks } from "./LegalLinks";
import { AddDobavkiSheet, hasDobavki } from "./AddDobavkiSheet";
import { ContactStep } from "./ContactStep";
import styles from "./CartPage.module.css";

function rejectionText(error: OrderRejectedError) {
  switch (error.code) {
    case "MIN_ORDER":
      return `Минимальная сумма заказа на доставку — ${formatPrice(error.minOrder ?? 0)}.`;
    case "OUT_OF_ZONE":
      return "К сожалению, мы не доставляем по этому адресу.";
    case "ADDRESS_NOT_FOUND":
    case "GEOCODE_FAILED":
      return "Не удалось проверить адрес доставки. Укажите его ещё раз.";
    case "DELIVERY_DISABLED":
      return "Доставка сейчас недоступна. Выберите самовывоз.";
    case "DELIVERY_REQUIRES_CARD":
      return "Доставка оплачивается только картой или через СБП.";
    case "CARD_DISABLED":
      return "Оплата картой сейчас недоступна. Выберите оплату наличными.";
    default:
      return "Не удалось начать оплату. Попробуйте ещё раз или выберите оплату наличными.";
  }
}

/**
 * Savat sahifasi — mahsulotlar ro'yxati, miqdorini o'zgartirish va
 * yakuniy "Заказать" tugmasi shu yerda. Bosilganda buyurtma serverga
 * yuboriladi, savat tozalanadi va mijoz buyurtma holati sahifasiga o'tadi.
 */
export function CartPage() {
  const { cartItems, totalCount, totalPrice, add, remove, setComment, clear } = useCart();
  const { fulfillmentType, cafeId, address, deliveryCoords, deliveryFee } = useOrderStore();
  const { name: customerName, phone } = useCustomerStore();
  const addMyOrder = useMyOrdersStore((s) => s.addOrder);
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dobavkiOpen, setDobavkiOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [checkoutConfig, setCheckoutConfig] = useState<CheckoutConfig | null>(null);
  // Izoh maydoni ochiq turgan mahsulot id'si — bir vaqtda faqat bittasi
  // ochiq bo'ladi, ro'yxat cho'zilib ketmasligi uchun.
  const [openCommentId, setOpenCommentId] = useState<string | null>(null);

  useEffect(() => {
    fetchCheckoutConfig()
      .then(setCheckoutConfig)
      // Server javob bermasa — naqd to'lov baribir ishlaydi, karta "скоро" qoladi.
      .catch(() => {});
  }, []);

  const cardEnabled = Boolean(checkoutConfig?.cardEnabled);
  const isDelivery = fulfillmentType === "DELIVERY";
  // Kuryer naqd pul olmaydi — yetkazib berish faqat oldindan to'lanadi.
  const effectiveMethod: PaymentMethod = isDelivery ? "CARD" : paymentMethod;
  const deliveryUnavailable = isDelivery && checkoutConfig !== null && !checkoutConfig.deliveryEnabled;
  const fee = isDelivery ? deliveryFee : 0;
  const grandTotal = totalPrice + fee;
  const minOrder = checkoutConfig?.delivery.minOrder ?? 0;
  const belowMinOrder = isDelivery && totalPrice < minOrder;

  const cafe = findCafe(cafeId);
  const fulfillmentSummary =
    fulfillmentType === "DELIVERY" ? address || "Укажите адрес доставки" : cafe?.name ?? "";

  const handleCheckout = async () => {
    if (submitting) return;

    if (fulfillmentType === "DELIVERY" && !address.trim()) {
      setError("Укажите адрес доставки перед оформлением заказа.");
      setSheetOpen(true);
      return;
    }
    if (belowMinOrder) {
      setError(`Минимальная сумма заказа на доставку — ${formatPrice(minOrder)}.`);
      return;
    }
    if (!customerName.trim() || !phone) {
      setError("Укажите имя и номер телефона перед оформлением заказа.");
      return;
    }

    setSubmitting(true);
    setError("");

    const payload = {
      items: cartItems.map(({ id, name, price, quantity, comment }) => ({
        id,
        name,
        price,
        quantity,
        comment,
      })),
      total: grandTotal,
      orderType: fulfillmentType,
      cafeId: fulfillmentType === "PICKUP" ? cafeId : undefined,
      address: fulfillmentType === "DELIVERY" ? address.trim() : undefined,
      latitude: fulfillmentType === "DELIVERY" ? deliveryCoords?.lat : undefined,
      longitude: fulfillmentType === "DELIVERY" ? deliveryCoords?.lng : undefined,
      customerName: customerName.trim(),
      phone: phone.trim(),
      paymentMethod: effectiveMethod,
    };

    try {
      const result = await submitOrder(payload);
      addMyOrder({ id: result.orderId, token: result.trackingToken, createdAt: new Date().toISOString() });
      clear();
      if (result.paymentUrl) {
        window.location.assign(result.paymentUrl);
        return;
      }
      router.replace(`/order/${result.orderId}?t=${encodeURIComponent(result.trackingToken)}`);
    } catch (err) {
      setError(
        err instanceof OrderRejectedError
          ? rejectionText(err)
          : "Не удалось отправить заказ. Проверьте интернет и попробуйте снова."
      );
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button
          type="button"
          className={styles.back}
          onClick={() => router.back()}
          aria-label="Назад"
        >
          ←
        </button>
        <h1 className={styles.title}>Корзина</h1>
      </header>

      {cartItems.length === 0 ? (
        <p className={styles.empty}>Ваша корзина пуста. Выберите товар из меню.</p>
      ) : (
        <>
          <div className={styles.list}>
            {cartItems.map((item) => (
              <div key={item.id} className={styles.rowCard}>
                <div className={styles.row}>
                  <div className={styles.info}>
                    <span className={styles.name}>{item.name}</span>
                    <span className={styles.lineTotal}>
                      {formatPrice(item.price)} × {item.quantity} ={" "}
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>

                  <div className={styles.right}>
                    <button
                      type="button"
                      className={styles.stepBtn}
                      onClick={() => remove(item)}
                      aria-label={`Уменьшить количество «${item.name}»`}
                    >
                      −
                    </button>
                    <span className={styles.qty}>{item.quantity}</span>
                    <button
                      type="button"
                      className={styles.stepBtn}
                      onClick={() => add(item)}
                      aria-label={`Увеличить количество «${item.name}»`}
                    >
                      +
                    </button>
                  </div>
                </div>

                {openCommentId === item.id ? (
                  <input
                    type="text"
                    className={styles.commentInput}
                    placeholder="Например: без лука, соус отдельно…"
                    value={item.comment ?? ""}
                    autoFocus
                    maxLength={200}
                    onChange={(e) => setComment(item.id, e.target.value)}
                    onBlur={() => setOpenCommentId(null)}
                  />
                ) : (
                  <button
                    type="button"
                    className={styles.commentToggle}
                    onClick={() => setOpenCommentId(item.id)}
                  >
                    💬 {item.comment ? item.comment : "Добавить комментарий"}
                  </button>
                )}
              </div>
            ))}
          </div>

          {hasDobavki && (
            <button
              type="button"
              className={styles.dobavkiBtn}
              onClick={() => setDobavkiOpen(true)}
            >
              ➕ Добавки
            </button>
          )}

          <div className={styles.options}>
            <button
              type="button"
              className={styles.fulfillmentOption}
              onClick={() => setSheetOpen(true)}
            >
              <span className={styles.fulfillmentIcon}>
                {fulfillmentType === "DELIVERY" ? "🚚" : "🏠"}
              </span>
              <span className={styles.fulfillmentText}>
                <span className={styles.fulfillmentLabel}>
                  {fulfillmentType === "DELIVERY" ? "Доставка" : "Самовывоз"}
                </span>
                <span className={styles.fulfillmentValue}>{fulfillmentSummary}</span>
              </span>
              <span className={styles.change}>Изменить</span>
            </button>

            {!isDelivery && (
              <button
                type="button"
                className={`${styles.option} ${effectiveMethod === "CASH" ? styles.optionActive : ""}`}
                aria-pressed={effectiveMethod === "CASH"}
                onClick={() => setPaymentMethod("CASH")}
              >
                {effectiveMethod === "CASH" && "✓ "}Оплата наличными
              </button>
            )}
            <button
              type="button"
              className={`${styles.option} ${effectiveMethod === "CARD" ? styles.optionActive : ""}`}
              aria-pressed={effectiveMethod === "CARD"}
              disabled={!cardEnabled}
              onClick={() => setPaymentMethod("CARD")}
            >
              {effectiveMethod === "CARD" && "✓ "}Оплата картой или СБП
              {!cardEnabled && <span className={styles.soon}> (скоро)</span>}
            </button>
          </div>

          <ContactStep />

          <AddressSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
          <AddDobavkiSheet open={dobavkiOpen} onClose={() => setDobavkiOpen(false)} />

          <div className={styles.summary}>
            {error && <p className={styles.errorText}>{error}</p>}
            {isDelivery && (
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Доставка</span>
                <span className={styles.summaryLabel}>{formatPrice(fee)}</span>
              </div>
            )}
            {deliveryUnavailable && (
              <p className={styles.errorText}>Доставка сейчас недоступна. Выберите самовывоз.</p>
            )}
            {belowMinOrder && (
              <p className={styles.errorText}>
                Минимальная сумма заказа на доставку — {formatPrice(minOrder)}
              </p>
            )}
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Итого ({totalCount} шт.)</span>
              <span className={styles.summaryTotal}>{formatPrice(grandTotal)}</span>
            </div>
            <button
              type="button"
              className={styles.checkoutBtn}
              onClick={handleCheckout}
              disabled={
                submitting || belowMinOrder || deliveryUnavailable || !customerName.trim() || !phone
              }
            >
              {submitting ? "Отправка…" : effectiveMethod === "CARD" ? "Оплатить и заказать" : "Заказать"}
            </button>
            {findPublishedLegalDoc("oferta") && (
              <p className={styles.consent}>
                Оформляя заказ, вы принимаете условия{" "}
                <Link href="/legal/oferta">публичной оферты</Link>
              </p>
            )}
          </div>
          <LegalLinks />
        </>
      )}
    </div>
  );
}
