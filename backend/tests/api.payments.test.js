import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

// Baza va ЮKassa mock qilinadi — buyurtma, to'lov va pul qaytarish mantig'i sinaladi.
const TOKEN = "secret-tracking-token";

function storedOrder(overrides = {}) {
  return {
    id: 7,
    customerName: "Иван",
    phone: "+7 (999) 123-45-67",
    trackingToken: TOKEN,
    status: "PENDING",
    orderType: "DELIVERY",
    cafeId: "grazhdanskiy-39b",
    address: "Невский 1",
    items: [{ id: "sh-klassicheskaya", name: "Шаверма классическая", price: 320, quantity: 2 }],
    total: 790,
    deliveryFee: 150,
    paymentMethod: "CARD",
    paymentStatus: "PENDING",
    paymentId: "pay-1",
    paymentUrl: "https://pay.example/1",
    ...overrides,
  };
}

vi.mock("../src/models/Order.js", () => ({
  createOrder: vi.fn(async (data) => ({ id: 7, status: "PENDING", ...data })),
  getOrderById: vi.fn(async () => storedOrder()),
  listOrders: vi.fn(async () => []),
  updateOrderStatus: vi.fn(async (id, status) => storedOrder({ id, status })),
  setOrderPayment: vi.fn(async (id, data) => storedOrder({ id, ...data })),
  findOrderByPaymentId: vi.fn(async () => storedOrder()),
  markOrderPaid: vi.fn(async () => storedOrder({ paymentStatus: "PAID" })),
  markOrderPaymentCanceled: vi.fn(async () =>
    storedOrder({ paymentStatus: "CANCELED", status: "CANCELLED" })
  ),
}));

vi.mock("../src/models/CustomerPushSubscription.js", () => ({
  saveCustomerPushSubscription: vi.fn(async () => {}),
  listCustomerPushSubscriptions: vi.fn(async () => []),
  deleteCustomerPushSubscription: vi.fn(async () => {}),
  deleteCustomerPushSubscriptionsForOrder: vi.fn(async () => {}),
}));

vi.mock("../src/utils/pushNotifications.js", () => ({
  notifyAdminDevicesNewOrder: vi.fn(),
  notifyCustomerOrderStatus: vi.fn(),
  isPushEnabled: vi.fn(() => false),
}));

vi.mock("../src/models/StoppedItem.js", () => ({
  listStoppedItemIds: vi.fn(async () => []),
  stopItem: vi.fn(),
  unstopItem: vi.fn(),
}));

vi.mock("../src/utils/yookassa.js", () => ({
  isCardPaymentEnabled: vi.fn(() => true),
  createPayment: vi.fn(async () => ({
    id: "pay-1",
    status: "pending",
    confirmation: { confirmation_url: "https://pay.example/1" },
  })),
  getPayment: vi.fn(async () => ({
    id: "pay-1",
    status: "succeeded",
    amount: { value: "790.00", currency: "RUB" },
  })),
  createRefund: vi.fn(async () => ({ id: "ref-1", status: "succeeded" })),
}));

vi.mock("../src/utils/yandexDelivery.js", () => ({
  isCourierEnabled: vi.fn(() => true),
  createClaim: vi.fn(),
  getClaim: vi.fn(),
  acceptClaim: vi.fn(),
  getClaimCancelInfo: vi.fn(),
  cancelClaim: vi.fn(),
}));

vi.mock("../src/core/sseClients.js", () => ({
  broadcastNewOrder: vi.fn(),
  addSseClient: vi.fn(),
  removeSseClient: vi.fn(),
}));

const { createServer } = await import("../src/core/server.js");
const { config } = await import("../src/config/default.js");
const Order = await import("../src/models/Order.js");
const yookassa = await import("../src/utils/yookassa.js");
const yandex = await import("../src/utils/yandexDelivery.js");
const { notifyAdminDevicesNewOrder } = await import("../src/utils/pushNotifications.js");
const { broadcastNewOrder } = await import("../src/core/sseClients.js");

const app = createServer();

// Kafega yaqin nuqta (birinchi zona) va zonadan tashqari nuqta.
const NEAR = { latitude: 60.02, longitude: 30.4 };
const FAR = { latitude: 59.5, longitude: 30.4 };

function body(overrides = {}) {
  return {
    items: [{ id: "sh-klassicheskaya", quantity: 3 }],
    total: 1,
    orderType: "DELIVERY",
    address: "Невский 1",
    customerName: "Иван",
    phone: "+79991234567",
    paymentMethod: "CARD",
    ...NEAR,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  config.adminPassword = "pw";
});

describe("yetkazib berish", () => {
  it("adds the server-computed fee to the total and assigns the branch", async () => {
    const res = await request(app).post("/api/orders").send(body());

    expect(res.status).toBe(201);
    expect(Order.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({ total: 1110, deliveryFee: 150, cafeId: "grazhdanskiy-39b" })
    );
  });

  it("rejects cash, because the Yandex courier cannot collect it", async () => {
    const res = await request(app).post("/api/orders").send(body({ paymentMethod: "CASH" }));

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("DELIVERY_REQUIRES_CARD");
    expect(Order.createOrder).not.toHaveBeenCalled();
  });

  it("is off until the Yandex courier is configured", async () => {
    yandex.isCourierEnabled.mockReturnValueOnce(false);
    const res = await request(app).post("/api/orders").send(body());

    expect(res.body.code).toBe("DELIVERY_DISABLED");
    expect(Order.createOrder).not.toHaveBeenCalled();
  });

  it("rejects an address outside the delivery zone", async () => {
    const res = await request(app).post("/api/orders").send(body(FAR));

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("OUT_OF_ZONE");
    expect(Order.createOrder).not.toHaveBeenCalled();
  });

  it("rejects an order below the minimum amount", async () => {
    const res = await request(app)
      .post("/api/orders")
      .send(body({ items: [{ id: "sous-ketchup", quantity: 1 }] }));

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("MIN_ORDER");
  });

  it("quotes a fee by coordinates", async () => {
    const res = await request(app)
      .post("/api/delivery/quote")
      .send({ address: "Невский 1", ...NEAR });

    expect(res.body).toMatchObject({ available: true, fee: 150 });
  });
});

describe("karta bilan to'lov", () => {
  it("returns the payment link and does not alert the kitchen until paid", async () => {
    const res = await request(app).post("/api/orders").send(body({ paymentMethod: "CARD" }));

    expect(res.status).toBe(201);
    expect(res.body.paymentUrl).toBe("https://pay.example/1");
    expect(Order.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({ paymentMethod: "CARD", paymentStatus: "PENDING" })
    );
    expect(broadcastNewOrder).not.toHaveBeenCalled();
    expect(notifyAdminDevicesNewOrder).not.toHaveBeenCalled();
  });

  it("refuses card payment when the shop keys are not configured", async () => {
    yookassa.isCardPaymentEnabled.mockReturnValueOnce(false);
    const res = await request(app).post("/api/orders").send(body({ paymentMethod: "CARD" }));

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("CARD_DISABLED");
    expect(Order.createOrder).not.toHaveBeenCalled();
  });

  it("cancels the order when the payment cannot be created", async () => {
    yookassa.createPayment.mockRejectedValueOnce(new Error("down"));
    const res = await request(app).post("/api/orders").send(body({ paymentMethod: "CARD" }));

    expect(res.status).toBe(502);
    expect(res.body.code).toBe("PAYMENT_FAILED");
    expect(Order.setOrderPayment).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ paymentStatus: "CANCELED", status: "CANCELLED" })
    );
  });

  it("webhook re-checks the payment with the API, then alerts the kitchen", async () => {
    const res = await request(app)
      .post("/api/payments/yookassa")
      .send({ type: "notification", event: "payment.succeeded", object: { id: "pay-1" } });

    expect(res.status).toBe(200);
    expect(yookassa.getPayment).toHaveBeenCalledWith("pay-1");
    expect(Order.markOrderPaid).toHaveBeenCalledWith(7);
    expect(broadcastNewOrder).toHaveBeenCalledTimes(1);
  });

  it("does not trust a forged webhook when the API says the payment is unpaid", async () => {
    yookassa.getPayment.mockResolvedValueOnce({
      id: "pay-1",
      status: "pending",
      amount: { value: "790.00" },
    });
    await request(app)
      .post("/api/payments/yookassa")
      .send({ event: "payment.succeeded", object: { id: "pay-1" } });

    expect(Order.markOrderPaid).not.toHaveBeenCalled();
  });

  it("does not mark paid when the amount differs from the order total", async () => {
    yookassa.getPayment.mockResolvedValueOnce({
      id: "pay-1",
      status: "succeeded",
      amount: { value: "1.00" },
    });
    await request(app)
      .post("/api/payments/yookassa")
      .send({ event: "payment.succeeded", object: { id: "pay-1" } });

    expect(Order.markOrderPaid).not.toHaveBeenCalled();
  });

  it("alerts the kitchen only once when the webhook repeats", async () => {
    Order.markOrderPaid.mockResolvedValueOnce(null);
    await request(app)
      .post("/api/payments/yookassa")
      .send({ event: "payment.succeeded", object: { id: "pay-1" } });

    expect(broadcastNewOrder).not.toHaveBeenCalled();
  });

  it("asks YooKassa to retry when the check fails", async () => {
    yookassa.getPayment.mockRejectedValueOnce(new Error("down"));
    const res = await request(app)
      .post("/api/payments/yookassa")
      .send({ event: "payment.succeeded", object: { id: "pay-1" } });

    expect(res.status).toBe(500);
  });

  it("customer page syncs a pending payment after returning from the bank", async () => {
    Order.markOrderPaid.mockResolvedValueOnce(storedOrder({ paymentStatus: "PAID" }));
    const res = await request(app).get(`/api/orders/7?t=${TOKEN}`);

    expect(res.body.order.paymentStatus).toBe("PAID");
    expect(res.body.order.paymentUrl).toBeUndefined();
  });
});

describe("pulni qaytarish", () => {
  const auth = { Authorization: "Bearer pw" };

  it("refunds a paid order when the admin cancels it", async () => {
    Order.getOrderById.mockResolvedValueOnce(storedOrder({ paymentStatus: "PAID" }));
    const res = await request(app)
      .patch("/api/admin/orders/7")
      .set(auth)
      .send({ status: "CANCELLED" });

    expect(res.status).toBe(200);
    expect(yookassa.createRefund).toHaveBeenCalled();
    expect(Order.setOrderPayment).toHaveBeenCalledWith(7, { paymentStatus: "REFUNDED" });
  });

  it("keeps the order active when the refund fails", async () => {
    Order.getOrderById.mockResolvedValueOnce(storedOrder({ paymentStatus: "PAID" }));
    yookassa.createRefund.mockRejectedValueOnce(new Error("down"));
    const res = await request(app)
      .patch("/api/admin/orders/7")
      .set(auth)
      .send({ status: "CANCELLED" });

    expect(res.status).toBe(502);
    expect(Order.updateOrderStatus).not.toHaveBeenCalled();
  });

  it("does not refund cash orders", async () => {
    Order.getOrderById.mockResolvedValueOnce(
      storedOrder({ paymentMethod: "CASH", paymentStatus: "NOT_REQUIRED" })
    );
    await request(app).patch("/api/admin/orders/7").set(auth).send({ status: "CANCELLED" });

    expect(yookassa.createRefund).not.toHaveBeenCalled();
  });

  it("does not reopen a refunded order", async () => {
    Order.getOrderById.mockResolvedValueOnce(
      storedOrder({ paymentStatus: "REFUNDED", status: "CANCELLED" })
    );
    const res = await request(app)
      .patch("/api/admin/orders/7")
      .set(auth)
      .send({ status: "CONFIRMED" });

    expect(res.status).toBe(409);
  });
});
