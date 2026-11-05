import crypto from "node:crypto";
import { config } from "../config/default.js";
import { CAFES } from "../data/cafes.js";

export function isCourierEnabled() {
  return Boolean(config.yandexDeliveryToken && config.cafePhone && config.cafeEmail);
}

async function request(path, { claimId, requestId, body } = {}) {
  const query = claimId
    ? `?claim_id=${encodeURIComponent(claimId)}`
    : requestId
      ? `?request_id=${encodeURIComponent(requestId)}`
      : "";
  const res = await fetch(`${config.yandexDeliveryApiUrl}${path}${query}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.yandexDeliveryToken}`,
      "Accept-Language": "ru",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Yandex Delivery ${path}: ${res.status} ${data.code ?? ""} ${data.message ?? ""}`);
  }
  return data;
}

function buildClaim(order) {
  const cafe = CAFES.find((c) => c.id === order.cafeId) ?? CAFES[0];
  const orderRef = String(order.id);
  const cafeContact = { name: "Shaverma SPB", phone: config.cafePhone };

  return {
    items: order.items.map((item) => ({
      extra_id: item.id,
      title: item.name,
      quantity: item.quantity,
      cost_value: item.price.toFixed(2),
      cost_currency: "RUB",
      pickup_point: 1,
      dropoff_point: 2,
    })),
    route_points: [
      {
        point_id: 1,
        visit_order: 1,
        type: "source",
        // Koordinata tartibi: avval uzunlik, keyin kenglik.
        address: { fullname: cafe.address, coordinates: [cafe.lng, cafe.lat] },
        contact: { ...cafeContact, email: config.cafeEmail },
        external_order_id: orderRef,
      },
      {
        point_id: 2,
        visit_order: 2,
        type: "destination",
        address: { fullname: order.address, coordinates: [order.longitude, order.latitude] },
        contact: { name: order.customerName, phone: order.phone.replace(/[^\d+]/g, "") },
        external_order_id: orderRef,
      },
    ],
    emergency_contact: cafeContact,
    client_requirements: { taxi_class: config.yandexDeliveryTaxiClass },
  };
}

export async function createClaim(order) {
  return request("/claims/create", { requestId: crypto.randomUUID(), body: buildClaim(order) });
}

export async function getClaim(claimId) {
  return request("/claims/info", { claimId });
}

export async function acceptClaim(claimId, version) {
  return request("/claims/accept", { claimId, body: { version } });
}

export async function getClaimCancelInfo(claimId) {
  return request("/claims/cancel-info", { claimId });
}

export async function cancelClaim(claimId, version, cancelState) {
  return request("/claims/cancel", { claimId, body: { version, cancel_state: cancelState } });
}
