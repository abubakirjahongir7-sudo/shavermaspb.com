import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("web-push", () => ({
  default: { setVapidDetails: vi.fn(), sendNotification: vi.fn(async () => ({})) },
}));

vi.mock("../src/models/PushSubscription.js", () => ({
  listPushSubscriptions: vi.fn(async () => []),
  deletePushSubscription: vi.fn(async () => {}),
  savePushSubscription: vi.fn(async () => {}),
}));

vi.mock("../src/models/CustomerPushSubscription.js", () => ({
  listCustomerPushSubscriptions: vi.fn(async () => []),
  deleteCustomerPushSubscription: vi.fn(async () => {}),
  deleteCustomerPushSubscriptionsForOrder: vi.fn(async () => {}),
  saveCustomerPushSubscription: vi.fn(async () => {}),
}));

const { config } = await import("../src/config/default.js");
config.vapidPublicKey = "test-public";
config.vapidPrivateKey = "test-private";

const webpush = (await import("web-push")).default;
const { listPushSubscriptions, deletePushSubscription } = await import(
  "../src/models/PushSubscription.js"
);
const {
  listCustomerPushSubscriptions,
  deleteCustomerPushSubscription,
  deleteCustomerPushSubscriptionsForOrder,
} = await import("../src/models/CustomerPushSubscription.js");
const {
  buildOrderPushPayload,
  notifyAdminDevicesNewOrder,
  buildCustomerStatusPayload,
  notifyCustomerOrderStatus,
} = await import("../src/utils/pushNotifications.js");

function order(overrides = {}) {
  return { id: 7, orderType: "PICKUP", cafeId: "grazhdanskiy-39b", address: null, total: 658, ...overrides };
}

const sub = (endpoint) => ({ endpoint, p256dh: "p", auth: "a", cafeId: "grazhdanskiy-39b" });

describe("utils/pushNotifications", () => {
  beforeEach(() => vi.clearAllMocks());

  it("builds a payload that opens the admin panel", () => {
    const payload = buildOrderPushPayload(order());
    expect(payload.title).toContain("#7");
    expect(payload.body).toContain("Гражданский пр., 39Б");
    expect(payload.body).toContain("658 ₽");
    expect(payload.url).toBe("/admin");
  });

  it("sends only to devices subscribed to the order's branch", async () => {
    vi.mocked(listPushSubscriptions).mockResolvedValueOnce([sub("https://a"), sub("https://b")]);

    await notifyAdminDevicesNewOrder(order());

    expect(listPushSubscriptions).toHaveBeenCalledWith("grazhdanskiy-39b");
    expect(webpush.sendNotification).toHaveBeenCalledTimes(2);
    const [target, , options] = vi.mocked(webpush.sendNotification).mock.calls[0];
    expect(target).toEqual({ endpoint: "https://a", keys: { p256dh: "p", auth: "a" } });
    expect(options.urgency).toBe("high");
  });

  it("sends delivery orders (no branch) to every device", async () => {
    await notifyAdminDevicesNewOrder(order({ orderType: "DELIVERY", cafeId: null, address: "ул. 1" }));
    expect(listPushSubscriptions).toHaveBeenCalledWith(null);
  });

  it("removes expired subscriptions (410) and keeps sending to the rest", async () => {
    vi.mocked(listPushSubscriptions).mockResolvedValueOnce([sub("https://gone"), sub("https://ok")]);
    vi.mocked(webpush.sendNotification).mockImplementation(async (target) => {
      if (target.endpoint === "https://gone") throw Object.assign(new Error("Gone"), { statusCode: 410 });
      return {};
    });

    await notifyAdminDevicesNewOrder(order());

    expect(deletePushSubscription).toHaveBeenCalledWith("https://gone");
    expect(deletePushSubscription).toHaveBeenCalledTimes(1);
    expect(webpush.sendNotification).toHaveBeenCalledTimes(2);
  });

  it("does nothing when VAPID keys are not configured", async () => {
    config.vapidPrivateKey = "";
    await notifyAdminDevicesNewOrder(order());
    await notifyCustomerOrderStatus(order({ status: "READY", trackingToken: "t" }));
    expect(listPushSubscriptions).not.toHaveBeenCalled();
    expect(listCustomerPushSubscriptions).not.toHaveBeenCalled();
    config.vapidPrivateKey = "test-private";
  });
});

describe("customer order status push", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(webpush.sendNotification).mockImplementation(async () => ({}));
  });

  const tracked = (overrides = {}) => order({ trackingToken: "tok", ...overrides });

  it("builds a payload that opens the customer's own order page", () => {
    const ready = buildCustomerStatusPayload(tracked({ status: "READY" }));
    expect(ready.title).toContain("#7");
    expect(ready.title).toContain("готов");
    expect(ready.url).toBe("/order/7?t=tok");
  });

  it("does not notify the customer about a brand-new (PENDING) order", async () => {
    expect(buildCustomerStatusPayload(tracked({ status: "PENDING" }))).toBeNull();
    await notifyCustomerOrderStatus(tracked({ status: "PENDING" }));
    expect(listCustomerPushSubscriptions).not.toHaveBeenCalled();
  });

  it("sends to the order's subscribed devices and drops expired ones", async () => {
    vi.mocked(listCustomerPushSubscriptions).mockResolvedValueOnce([
      { id: 1, endpoint: "https://gone", p256dh: "p", auth: "a" },
      { id: 2, endpoint: "https://ok", p256dh: "p", auth: "a" },
    ]);
    vi.mocked(webpush.sendNotification).mockImplementation(async (target) => {
      if (target.endpoint === "https://gone") throw Object.assign(new Error("Gone"), { statusCode: 404 });
      return {};
    });

    await notifyCustomerOrderStatus(tracked({ status: "CONFIRMED" }));

    expect(listCustomerPushSubscriptions).toHaveBeenCalledWith(7);
    expect(webpush.sendNotification).toHaveBeenCalledTimes(2);
    expect(deleteCustomerPushSubscription).toHaveBeenCalledWith(1);
    expect(deleteCustomerPushSubscriptionsForOrder).not.toHaveBeenCalled();
  });

  it("forgets the order's subscriptions once it is delivered or cancelled", async () => {
    vi.mocked(listCustomerPushSubscriptions).mockResolvedValue([
      { id: 3, endpoint: "https://ok", p256dh: "p", auth: "a" },
    ]);

    await notifyCustomerOrderStatus(tracked({ status: "CANCELLED" }));
    expect(deleteCustomerPushSubscriptionsForOrder).toHaveBeenCalledWith(7);
  });
});
