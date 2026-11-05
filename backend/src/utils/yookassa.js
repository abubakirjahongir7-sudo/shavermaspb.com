import crypto from "node:crypto";
import { config } from "../config/default.js";

export function isCardPaymentEnabled() {
  return Boolean(config.yookassaShopId && config.yookassaSecretKey && config.frontendUrl);
}

async function request(method, path, { body, idempotenceKey } = {}) {
  const credentials = Buffer.from(`${config.yookassaShopId}:${config.yookassaSecretKey}`).toString(
    "base64"
  );
  const res = await fetch(`${config.yookassaApiUrl}${path}`, {
    method,
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
      ...(idempotenceKey ? { "Idempotence-Key": idempotenceKey } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`YooKassa ${method} ${path}: ${res.status} ${data.code ?? ""} ${data.description ?? ""}`);
  }
  return data;
}

function money(rubles) {
  return { value: rubles.toFixed(2), currency: "RUB" };
}

/** 54-ФЗ cheki — faqat YOOKASSA_SEND_RECEIPT=true bo'lganda yuboriladi. */
function buildReceipt(order) {
  if (!config.yookassaSendReceipt) return undefined;

  const line = (description, quantity, price, paymentSubject) => ({
    description: description.slice(0, 128),
    quantity,
    amount: money(price),
    vat_code: config.yookassaVatCode,
    payment_mode: "full_payment",
    payment_subject: paymentSubject,
  });

  const items = order.items.map((item) => line(item.name, item.quantity, item.price, "commodity"));
  if (order.deliveryFee > 0) items.push(line("Доставка", 1, order.deliveryFee, "service"));

  return { customer: { phone: order.phone.replace(/\D/g, "") }, items };
}

export async function createPayment(order) {
  const receipt = buildReceipt(order);
  return request("POST", "/payments", {
    idempotenceKey: `order-${order.id}-${crypto.randomUUID()}`.slice(0, 64),
    body: {
      amount: money(order.total),
      capture: true,
      confirmation: {
        type: "redirect",
        return_url: `${config.frontendUrl}/order/${order.id}?t=${encodeURIComponent(order.trackingToken)}`,
      },
      description: `Заказ №${order.id}`,
      metadata: { orderId: String(order.id) },
      ...(receipt ? { receipt } : {}),
    },
  });
}

export async function getPayment(paymentId) {
  return request("GET", `/payments/${encodeURIComponent(paymentId)}`);
}

export async function createRefund(order) {
  const receipt = buildReceipt(order);
  return request("POST", "/refunds", {
    // Bitta buyurtma uchun takroriy so'rov ikkinchi marta pul qaytarmasligi kerak.
    idempotenceKey: `refund-order-${order.id}`,
    body: {
      payment_id: order.paymentId,
      amount: money(order.total),
      ...(receipt ? { receipt } : {}),
    },
  });
}
