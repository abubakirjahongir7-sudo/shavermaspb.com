import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../src/models/PushSubscription.js", () => ({
  listPushSubscriptions: vi.fn(async () => []),
  deletePushSubscription: vi.fn(async () => {}),
  savePushSubscription: vi.fn(async () => {}),
}));

const { createServer } = await import("../src/core/server.js");
const { config } = await import("../src/config/default.js");
const { savePushSubscription, deletePushSubscription } = await import(
  "../src/models/PushSubscription.js"
);

const app = createServer();
const auth = () => ({ Authorization: `Bearer ${config.adminPassword}` });

const validSubscription = {
  endpoint: "https://fcm.googleapis.com/fcm/send/abc",
  keys: { p256dh: "key", auth: "secret" },
};

describe("Web Push admin API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requires admin auth", async () => {
    const res = await request(app)
      .post("/api/admin/push/subscribe")
      .send({ subscription: validSubscription, cafeId: "grazhdanskiy-39b" });
    expect(res.status).toBe(401);
    expect(savePushSubscription).not.toHaveBeenCalled();
  });

  it("returns the VAPID public key without auth when push is configured", async () => {
    config.vapidPublicKey = "pub";
    config.vapidPrivateKey = "priv";
    const res = await request(app).get("/api/push/public-key");
    expect(res.status).toBe(200);
    expect(res.body.publicKey).toBe("pub");

    config.vapidPrivateKey = "";
    const off = await request(app).get("/api/push/public-key");
    expect(off.status).toBe(503);
  });

  it("saves a subscription bound to the given branch", async () => {
    const res = await request(app)
      .post("/api/admin/push/subscribe")
      .set(auth())
      .send({ subscription: validSubscription, cafeId: "grazhdanskiy-39b" });

    expect(res.status).toBe(201);
    expect(savePushSubscription).toHaveBeenCalledWith({
      endpoint: validSubscription.endpoint,
      p256dh: "key",
      auth: "secret",
      cafeId: "grazhdanskiy-39b",
    });
  });

  it("rejects an invalid branch or subscription", async () => {
    const badCafe = await request(app)
      .post("/api/admin/push/subscribe")
      .set(auth())
      .send({ subscription: validSubscription, cafeId: "nope" });
    expect(badCafe.status).toBe(400);

    const badSub = await request(app)
      .post("/api/admin/push/subscribe")
      .set(auth())
      .send({ subscription: { endpoint: "http://insecure" }, cafeId: "grazhdanskiy-39b" });
    expect(badSub.status).toBe(400);
    expect(savePushSubscription).not.toHaveBeenCalled();
  });

  it("unsubscribes by endpoint", async () => {
    const res = await request(app)
      .post("/api/admin/push/unsubscribe")
      .set(auth())
      .send({ endpoint: validSubscription.endpoint });
    expect(res.status).toBe(200);
    expect(deletePushSubscription).toHaveBeenCalledWith(validSubscription.endpoint);
  });
});
