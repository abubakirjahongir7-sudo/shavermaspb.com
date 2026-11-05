import { DELIVERY_CONFIG } from "../data/delivery.js";
import { quoteDelivery } from "../utils/delivery.js";
import { isCardPaymentEnabled } from "../utils/yookassa.js";
import { isCourierEnabled } from "../utils/yandexDelivery.js";

/** GET /api/checkout/config — savat sahifasi uchun ochiq sozlamalar. */
export function getCheckoutConfigHandler(req, res) {
  res.json({
    cardEnabled: isCardPaymentEnabled(),
    deliveryEnabled: isCardPaymentEnabled() && isCourierEnabled(),
    delivery: DELIVERY_CONFIG,
  });
}

/** POST /api/delivery/quote  Body: { address, latitude?, longitude? } */
export async function quoteDeliveryHandler(req, res) {
  const { address, latitude, longitude } = req.body ?? {};
  if (typeof address !== "string" || !address.trim()) {
    return res.status(400).json({ error: "address majburiy" });
  }
  res.json(await quoteDelivery({ address: address.trim().slice(0, 300), latitude, longitude }));
}
