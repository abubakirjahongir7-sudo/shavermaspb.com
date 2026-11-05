import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

// Haqiqiy bazaga yoki push serverlariga hech qanday so'rov ketmasligi uchun
// model va bildirishnoma qatlamlari to'liq mock qilinadi — faqat HTTP
// API'ning o'zi (validatsiya, status kodlar, javob shakli) sinaladi.
const TOKEN = "secret-tracking-token";

function storedOrder(overrides = {}) {
  return {
    id: 99,
    customerName: "Иван",
    phone: "+79991234567",
    trackingToken: TOKEN,
    status: "PENDING",
    orderType: "PICKUP",
    cafeId: "grazhdanskiy-39b",
    address: null,
    items: [{ id: "sh-klassicheskaya", name: "Шаверма классическая", price: 320, quantity: 1 }],
    total: 320,
    createdAt: "2026-10-15T10:00:00.000Z",
    updatedAt: "2026-10-15T10:00:00.000Z",
    ...overrides,
  };
}

vi.mock("../src/models/Order.js", () => ({
  createOrder: vi.fn(async (data) => ({ id: 99, status: "PENDING", ...data })),
  getOrderById: vi.fn(async () => storedOrder()),
  listOrders: vi.fn(async () => [storedOrder()]),
  updateOrderStatus: vi.fn(async (id, status) => storedOrder({ id, status })),
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

const { createServer } = await import("../src/core/server.js");
const { config } = await import("../src/config/default.js");
const { listStoppedItemIds } = await import("../src/models/StoppedItem.js");
const { createOrder, getOrderById } = await import("../src/models/Order.js");
const { saveCustomerPushSubscription } = await import("../src/models/CustomerPushSubscription.js");
const { notifyAdminDevicesNewOrder, notifyCustomerOrderStatus } = await import(
  "../src/utils/pushNotifications.js"
);

const app = createServer();
const adminAuth = () => ({ Authorization: `Bearer ${config.adminPassword}` });

function validOrderBody(overrides = {}) {
  return {
    items: [{ id: "sh-klassicheskaya", name: "Шаверма классическая", price: 320, quantity: 1 }],
    total: 320,
    orderType: "PICKUP",
    cafeId: "grazhdanskiy-39b",
    customerName: "Иван",
    phone: "+7 999 123-45-67",
    ...overrides,
  };
}

const lastCreated = () => vi.mocked(createOrder).mock.calls.at(-1)[0];

beforeEach(() => vi.clearAllMocks());

describe("GET /health", () => {
  it("responds ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});

describe("POST /api/orders", () => {
  it("accepts a valid pickup order and returns its id and a tracking token", async () => {
    const res = await request(app).post("/api/orders").send(validOrderBody());
    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.orderId).toBe(99);
    expect(res.body.trackingToken).toEqual(expect.any(String));
    expect(res.body.trackingToken.length).toBeGreaterThanOrEqual(24);
    expect(lastCreated()).toMatchObject({ customerName: "Иван", phone: "+7 999 123-45-67" });
    expect(notifyAdminDevicesNewOrder).toHaveBeenCalledTimes(1);
  });

  it("gives every order its own random tracking token", async () => {
    await request(app).post("/api/orders").send(validOrderBody());
    await request(app).post("/api/orders").send(validOrderBody());
    const [a, b] = vi.mocked(createOrder).mock.calls.map(([data]) => data.trackingToken);
    expect(a).not.toBe(b);
  });

  it("rejects a request with no items", async () => {
    const res = await request(app).post("/api/orders").send(validOrderBody({ items: [] }));
    expect(res.status).toBe(400);
  });

  it("requires a customer name and a plausible phone number", async () => {
    for (const body of [
      validOrderBody({ customerName: "  " }),
      validOrderBody({ phone: "" }),
      validOrderBody({ phone: "12-34" }),
      validOrderBody({ phone: "call me maybe" }),
    ]) {
      const res = await request(app).post("/api/orders").send(body);
      expect(res.status).toBe(400);
    }
    expect(createOrder).not.toHaveBeenCalled();
  });

  it("rejects pickup with an unknown cafeId", async () => {
    const res = await request(app)
      .post("/api/orders")
      .send(validOrderBody({ cafeId: "does-not-exist" }));
    expect(res.status).toBe(400);
  });

  it("rejects delivery with no address", async () => {
    const res = await request(app)
      .post("/api/orders")
      .send(validOrderBody({ orderType: "DELIVERY", cafeId: undefined, address: "" }));
    expect(res.status).toBe(400);
  });

  it("keeps delivery off until card payment and the courier are configured", async () => {
    const res = await request(app)
      .post("/api/orders")
      .send(validOrderBody({ orderType: "DELIVERY", cafeId: undefined, latitude: 60.02, longitude: 30.4, address: "ул. Тестовая, д. 1" }));
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("DELIVERY_DISABLED");
  });

  it("rejects an order containing a stopped (out-of-stock) item", async () => {
    vi.mocked(listStoppedItemIds).mockResolvedValueOnce(["sh-klassicheskaya"]);

    const res = await request(app).post("/api/orders").send(validOrderBody());

    expect(res.status).toBe(400);
    expect(res.body.stoppedItemIds).toEqual(["sh-klassicheskaya"]);
    expect(listStoppedItemIds).toHaveBeenCalledWith("grazhdanskiy-39b");
  });

  it("checks the stop list of the order's own cafe, not another one", async () => {
    vi.mocked(listStoppedItemIds).mockImplementation(async (cafeId) =>
      cafeId === "pionerskaya-37" ? ["sh-klassicheskaya"] : []
    );

    const res = await request(app).post("/api/orders").send(validOrderBody({ cafeId: "grazhdanskiy-39b" }));

    expect(res.status).toBe(201);
  });

  it("keeps a trimmed item comment and drops an empty one", async () => {
    await request(app)
      .post("/api/orders")
      .send(validOrderBody({ items: [{ id: "sh-klassicheskaya", quantity: 1, comment: "  без лука  " }] }));
    expect(lastCreated().items[0].comment).toBe("без лука");

    await request(app)
      .post("/api/orders")
      .send(validOrderBody({ items: [{ id: "sh-klassicheskaya", quantity: 1, comment: "   " }] }));
    expect(lastCreated().items[0].comment).toBeUndefined();
  });

  it("truncates an overly long item comment to 200 characters", async () => {
    await request(app)
      .post("/api/orders")
      .send(validOrderBody({ items: [{ id: "sh-klassicheskaya", quantity: 1, comment: "a".repeat(300) }] }));
    expect(lastCreated().items[0].comment).toHaveLength(200);
  });

  it("ignores a client-submitted price/total and recomputes them from the real menu", async () => {
    const res = await request(app).post("/api/orders").send(
      validOrderBody({
        items: [{ id: "sh-klassicheskaya", name: "ARZON QILIB YOZDIM", price: 1, quantity: 2 }],
        total: 2,
      })
    );

    expect(res.status).toBe(201);
    expect(lastCreated().items[0]).toMatchObject({ id: "sh-klassicheskaya", name: "Шаверма классическая", price: 320 });
    expect(lastCreated().total).toBe(640);
  });

  it("rejects an unknown menu item id or a bad quantity", async () => {
    const unknown = await request(app)
      .post("/api/orders")
      .send(validOrderBody({ items: [{ id: "mavjud-emas", quantity: 1 }] }));
    expect(unknown.status).toBe(400);

    const zero = await request(app)
      .post("/api/orders")
      .send(validOrderBody({ items: [{ id: "sh-klassicheskaya", quantity: 0 }] }));
    expect(zero.status).toBe(400);
  });
});

describe("GET /api/orders/:id (customer tracking)", () => {
  it("returns the order status for the right token, without phone or token", async () => {
    const res = await request(app).get(`/api/orders/99?t=${TOKEN}`);
    expect(res.status).toBe(200);
    expect(res.body.order).toMatchObject({ id: 99, status: "PENDING", total: 320 });
    expect(res.body.order.phone).toBeUndefined();
    expect(res.body.order.trackingToken).toBeUndefined();
  });

  it("answers 404 for a wrong or missing token so other orders stay private", async () => {
    expect((await request(app).get("/api/orders/99?t=wrong")).status).toBe(404);
    expect((await request(app).get("/api/orders/99")).status).toBe(404);
  });

  it("answers 404 for an unknown or non-numeric id", async () => {
    vi.mocked(getOrderById).mockResolvedValueOnce(null);
    expect((await request(app).get(`/api/orders/123?t=${TOKEN}`)).status).toBe(404);
    expect((await request(app).get(`/api/orders/abc?t=${TOKEN}`)).status).toBe(404);
  });
});

describe("POST /api/orders/:id/push (customer subscription)", () => {
  const subscription = {
    endpoint: "https://web.push.apple.com/abc",
    keys: { p256dh: "key", auth: "secret" },
  };

  it("saves the subscription for the order when the token matches", async () => {
    const res = await request(app).post("/api/orders/99/push").send({ token: TOKEN, subscription });
    expect(res.status).toBe(201);
    expect(saveCustomerPushSubscription).toHaveBeenCalledWith({
      orderId: 99,
      endpoint: subscription.endpoint,
      p256dh: "key",
      auth: "secret",
    });
  });

  it("refuses a wrong token or an invalid subscription", async () => {
    const wrong = await request(app).post("/api/orders/99/push").send({ token: "nope", subscription });
    expect(wrong.status).toBe(404);

    const insecure = await request(app)
      .post("/api/orders/99/push")
      .send({ token: TOKEN, subscription: { endpoint: "http://insecure", keys: { p256dh: "k", auth: "a" } } });
    expect(insecure.status).toBe(400);
    expect(saveCustomerPushSubscription).not.toHaveBeenCalled();
  });
});

describe("GET /api/admin/orders", () => {
  it("rejects a request with no Authorization header", async () => {
    const res = await request(app).get("/api/admin/orders");
    expect(res.status).toBe(401);
  });

  it("returns orders with the customer's contact but never the tracking token", async () => {
    const res = await request(app).get("/api/admin/orders").set(adminAuth());
    expect(res.status).toBe(200);
    expect(res.body.orders[0]).toMatchObject({ customerName: "Иван", phone: "+79991234567" });
    expect(res.body.orders[0].trackingToken).toBeUndefined();
  });
});

describe("PATCH /api/admin/orders/:id", () => {
  it("rejects a non-numeric id or an invalid status", async () => {
    const badId = await request(app)
      .patch("/api/admin/orders/not-a-number")
      .set(adminAuth())
      .send({ status: "CONFIRMED" });
    expect(badId.status).toBe(400);

    const badStatus = await request(app)
      .patch("/api/admin/orders/1")
      .set(adminAuth())
      .send({ status: "NOT_A_REAL_STATUS" });
    expect(badStatus.status).toBe(400);
  });

  it("changes the status, notifies the customer, and hides the tracking token", async () => {
    const res = await request(app)
      .patch("/api/admin/orders/1")
      .set(adminAuth())
      .send({ status: "CONFIRMED" });
    expect(res.status).toBe(200);
    expect(res.body.order.status).toBe("CONFIRMED");
    expect(res.body.order.trackingToken).toBeUndefined();
    expect(notifyCustomerOrderStatus).toHaveBeenCalledWith(expect.objectContaining({ id: 1, status: "CONFIRMED" }));
  });
});
