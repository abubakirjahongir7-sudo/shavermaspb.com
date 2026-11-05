import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../src/models/StoppedItem.js", () => ({
  listStoppedItemIds: vi.fn(async () => ["sh-klassicheskaya"]),
  stopItem: vi.fn(async () => {}),
  unstopItem: vi.fn(async () => {}),
}));

const { createServer } = await import("../src/core/server.js");
const { config } = await import("../src/config/default.js");
const { listStoppedItemIds, stopItem, unstopItem } = await import(
  "../src/models/StoppedItem.js"
);

const app = createServer();

describe("GET /api/stop-list", () => {
  it("is public (no auth) and returns the stopped item ids for the given cafe", async () => {
    const res = await request(app).get("/api/stop-list?cafeId=grazhdanskiy-39b");
    expect(res.status).toBe(200);
    expect(res.body.itemIds).toEqual(["sh-klassicheskaya"]);
    expect(listStoppedItemIds).toHaveBeenCalledWith("grazhdanskiy-39b");
  });

  it("rejects a missing or invalid cafeId", async () => {
    const missing = await request(app).get("/api/stop-list");
    expect(missing.status).toBe(400);

    const invalid = await request(app).get("/api/stop-list?cafeId=not-a-real-cafe");
    expect(invalid.status).toBe(400);
  });
});

describe("POST /api/admin/stop-list/:cafeId/:itemId", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requires admin auth", async () => {
    const res = await request(app).post("/api/admin/stop-list/grazhdanskiy-39b/sh-klassicheskaya");
    expect(res.status).toBe(401);
  });

  it("rejects an id that isn't a real menu item", async () => {
    const res = await request(app)
      .post("/api/admin/stop-list/grazhdanskiy-39b/not-a-real-item")
      .set("Authorization", `Bearer ${config.adminPassword}`);
    expect(res.status).toBe(400);
    expect(stopItem).not.toHaveBeenCalled();
  });

  it("rejects an id that isn't a real cafe", async () => {
    const res = await request(app)
      .post("/api/admin/stop-list/not-a-real-cafe/sh-klassicheskaya")
      .set("Authorization", `Bearer ${config.adminPassword}`);
    expect(res.status).toBe(400);
    expect(stopItem).not.toHaveBeenCalled();
  });

  it("stops a valid menu item in the given cafe only", async () => {
    const res = await request(app)
      .post("/api/admin/stop-list/grazhdanskiy-39b/sh-klassicheskaya")
      .set("Authorization", `Bearer ${config.adminPassword}`);
    expect(res.status).toBe(200);
    expect(stopItem).toHaveBeenCalledWith("grazhdanskiy-39b", "sh-klassicheskaya");
  });
});

describe("DELETE /api/admin/stop-list/:cafeId/:itemId", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requires admin auth", async () => {
    const res = await request(app).delete("/api/admin/stop-list/grazhdanskiy-39b/sh-klassicheskaya");
    expect(res.status).toBe(401);
  });

  it("removes an item from the given cafe's stop list only", async () => {
    const res = await request(app)
      .delete("/api/admin/stop-list/grazhdanskiy-39b/sh-klassicheskaya")
      .set("Authorization", `Bearer ${config.adminPassword}`);
    expect(res.status).toBe(200);
    expect(unstopItem).toHaveBeenCalledWith("grazhdanskiy-39b", "sh-klassicheskaya");
  });
});
