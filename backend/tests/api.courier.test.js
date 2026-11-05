import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

function storedOrder(overrides = {}) {
  return {
    id: 7,
    customerName: "Иван",
    phone: "+79991234567",
    trackingToken: "secret",
    status: "READY",
    orderType: "DELIVERY",
    cafeId: "grazhdanskiy-39b",
    address: "Невский 1",
    latitude: 60.02,
    longitude: 30.4,
    items: [{ id: "sh-sport", name: "Шаверма Спорт", price: 360, quantity: 2 }],
    total: 870,
    deliveryFee: 150,
    paymentMethod: "CARD",
    paymentStatus: "PAID",
    paymentId: "pay-1",
    paymentUrl: "https://pay.example/1",
    courierClaimId: null,
    courierStatus: null,
    courierName: null,
    ...overrides,
  };
}

vi.mock("../src/models/Order.js", () => ({
  createOrder: vi.fn(),
  getOrderById: vi.fn(async () => storedOrder()),
  listOrders: vi.fn(async () => []),
  listOrdersWithCourier: vi.fn(async () => []),
  updateOrderStatus: vi.fn(async (id, status) => storedOrder({ id, status })),
  setOrderPayment: vi.fn(),
  setOrderCourier: vi.fn(async (id, data) => storedOrder({ id, ...data })),
  findOrderByPaymentId: vi.fn(),
  markOrderPaid: vi.fn(),
  markOrderPaymentCanceled: vi.fn(),
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
  createPayment: vi.fn(),
  getPayment: vi.fn(),
  createRefund: vi.fn(async () => ({ status: "succeeded" })),
}));

vi.mock("../src/utils/yandexDelivery.js", () => ({
  isCourierEnabled: vi.fn(() => true),
  createClaim: vi.fn(async () => ({ id: "claim-1", status: "new", version: 1 })),
  getClaim: vi.fn(async () => ({ id: "claim-1", status: "estimating", version: 1 })),
  acceptClaim: vi.fn(async () => ({ id: "claim-1", status: "accepted", version: 1 })),
  getClaimCancelInfo: vi.fn(async () => ({ cancel_state: "free" })),
  cancelClaim: vi.fn(async () => ({ id: "claim-1", status: "cancelled", version: 1 })),
}));

const { createServer } = await import("../src/core/server.js");
const { config } = await import("../src/config/default.js");
const Order = await import("../src/models/Order.js");
const yandex = await import("../src/utils/yandexDelivery.js");
const { syncCourier } = await import("../src/controllers/courierController.js");
const { notifyCustomerOrderStatus } = await import("../src/utils/pushNotifications.js");

const app = createServer();
const auth = { Authorization: "Bearer pw" };
const active = { courierClaimId: "claim-1", courierStatus: "performer_found" };

beforeEach(() => {
  vi.clearAllMocks();
  config.adminPassword = "pw";
});

describe("kuryer chaqirish", () => {
  it("creates a claim for a paid delivery order", async () => {
    const res = await request(app).post("/api/admin/orders/7/courier").set(auth);

    expect(res.status).toBe(201);
    expect(yandex.createClaim).toHaveBeenCalled();
    expect(Order.setOrderCourier).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ courierClaimId: "claim-1", courierStatus: "new" })
    );
    expect(res.body.order.trackingToken).toBeUndefined();
  });

  it("requires the admin password", async () => {
    const res = await request(app).post("/api/admin/orders/7/courier");
    expect(res.status).toBe(401);
  });

  it("does not send a courier for an unpaid order", async () => {
    Order.getOrderById.mockResolvedValueOnce(storedOrder({ paymentStatus: "PENDING" }));
    const res = await request(app).post("/api/admin/orders/7/courier").set(auth);

    expect(res.status).toBe(409);
    expect(yandex.createClaim).not.toHaveBeenCalled();
  });

  it("does not call a second courier while one is active", async () => {
    Order.getOrderById.mockResolvedValueOnce(storedOrder(active));
    const res = await request(app).post("/api/admin/orders/7/courier").set(auth);

    expect(res.body.code).toBe("COURIER_ACTIVE");
    expect(yandex.createClaim).not.toHaveBeenCalled();
  });

  it("allows a new courier after none was found", async () => {
    Order.getOrderById.mockResolvedValueOnce(
      storedOrder({ courierClaimId: "claim-0", courierStatus: "performer_not_found" })
    );
    const res = await request(app).post("/api/admin/orders/7/courier").set(auth);

    expect(res.status).toBe(201);
  });

  it("is off without the Yandex token", async () => {
    yandex.isCourierEnabled.mockReturnValueOnce(false);
    const res = await request(app).post("/api/admin/orders/7/courier").set(auth);

    expect(res.body.code).toBe("COURIER_DISABLED");
  });
});

describe("kuryer holati", () => {
  const order = storedOrder(active);

  it("accepts the claim once Yandex has estimated it", async () => {
    yandex.getClaim.mockResolvedValueOnce({ id: "claim-1", status: "ready_for_approval", version: 3 });
    await syncCourier(order);

    expect(yandex.acceptClaim).toHaveBeenCalledWith("claim-1", 3);
    expect(Order.setOrderCourier).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ courierStatus: "accepted" })
    );
  });

  it("moves the order to 'on the way' when the courier picks it up", async () => {
    yandex.getClaim.mockResolvedValueOnce({
      id: "claim-1",
      status: "pickuped",
      version: 3,
      performer_info: { courier_name: "Алексей" },
    });
    await syncCourier(order);

    expect(Order.updateOrderStatus).toHaveBeenCalledWith(7, "OUT_FOR_DELIVERY");
    expect(notifyCustomerOrderStatus).toHaveBeenCalled();
    expect(Order.setOrderCourier).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ courierName: "Алексей" })
    );
  });

  it("marks the order delivered", async () => {
    yandex.getClaim.mockResolvedValueOnce({ id: "claim-1", status: "delivered", version: 3 });
    await syncCourier(order);

    expect(Order.updateOrderStatus).toHaveBeenCalledWith(7, "DELIVERED");
  });

  it("does not revive a cancelled order", async () => {
    yandex.getClaim.mockResolvedValueOnce({ id: "claim-1", status: "pickuped", version: 3 });
    await syncCourier(storedOrder({ ...active, status: "CANCELLED" }));

    expect(Order.updateOrderStatus).not.toHaveBeenCalled();
  });
});

describe("kuryerni bekor qilish", () => {
  it("cancels for free before the courier arrives", async () => {
    Order.getOrderById.mockResolvedValueOnce(storedOrder(active));
    yandex.getClaim.mockResolvedValueOnce({ id: "claim-1", status: "performer_found", version: 5 });
    const res = await request(app).post("/api/admin/orders/7/courier/cancel").set(auth);

    expect(res.status).toBe(200);
    expect(yandex.cancelClaim).toHaveBeenCalledWith("claim-1", 5, "free");
  });

  it("asks for confirmation when cancelling costs money", async () => {
    Order.getOrderById.mockResolvedValueOnce(storedOrder(active));
    yandex.getClaimCancelInfo.mockResolvedValueOnce({ cancel_state: "paid", price: "200.00" });
    const res = await request(app).post("/api/admin/orders/7/courier/cancel").set(auth);

    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({ code: "CANCEL_PAID", price: "200.00" });
    expect(yandex.cancelClaim).not.toHaveBeenCalled();
  });

  it("blocks cancelling and refunding an order while a courier is active", async () => {
    Order.getOrderById.mockResolvedValueOnce(storedOrder(active));
    const res = await request(app)
      .patch("/api/admin/orders/7")
      .set(auth)
      .send({ status: "CANCELLED" });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe("COURIER_ACTIVE");
    expect(Order.updateOrderStatus).not.toHaveBeenCalled();
  });
});
