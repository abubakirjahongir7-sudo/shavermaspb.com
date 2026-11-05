import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { config } from "../src/config/default.js";
import { createClaim, acceptClaim, isCourierEnabled } from "../src/utils/yandexDelivery.js";

const order = {
  id: 7,
  cafeId: "grazhdanskiy-39b",
  customerName: "Иван",
  phone: "+7 (999) 123-45-67",
  address: "Невский 1",
  latitude: 60.02,
  longitude: 30.4,
  items: [{ id: "sh-sport", name: "Шаверма Спорт", price: 360, quantity: 2 }],
};

let fetchMock;

beforeEach(() => {
  Object.assign(config, {
    yandexDeliveryToken: "token",
    cafePhone: "+79990000000",
    cafeEmail: "cafe@example.com",
  });
  fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({ id: "claim-1", status: "new" }) }));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  Object.assign(config, { yandexDeliveryToken: "", cafePhone: "", cafeEmail: "" });
});

describe("Yandex Доставка so'rovlari", () => {
  it("needs the token, phone and email", () => {
    expect(isCourierEnabled()).toBe(true);
    config.cafeEmail = "";
    expect(isCourierEnabled()).toBe(false);
  });

  it("creates a claim with a request id, auth headers and lon/lat coordinates", async () => {
    await createClaim(order);

    const [url, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body);
    expect(url).toMatch(/\/claims\/create\?request_id=.+/);
    expect(init.headers.Authorization).toBe("Bearer token");
    expect(init.headers["Accept-Language"]).toBe("ru");

    const [source, destination] = body.route_points;
    expect(source).toMatchObject({ point_id: 1, visit_order: 1, type: "source" });
    expect(source.contact).toMatchObject({ phone: "+79990000000", email: "cafe@example.com" });
    expect(destination.address.coordinates).toEqual([30.4, 60.02]);
    expect(destination.contact).toEqual({ name: "Иван", phone: "+79991234567" });
    expect(destination.external_order_id).toBe("7");

    expect(body.items[0]).toMatchObject({
      title: "Шаверма Спорт",
      quantity: 2,
      cost_value: "360.00",
      cost_currency: "RUB",
      pickup_point: 1,
      dropoff_point: 2,
    });
    expect(body.client_requirements.taxi_class).toBe("express");
  });

  it("accepts a claim by id and version", async () => {
    await acceptClaim("claim-1", 3);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/claims\/accept\?claim_id=claim-1$/);
    expect(JSON.parse(init.body)).toEqual({ version: 3 });
  });

  it("reports API errors", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({ code: "state_mismatch", message: "bad" }),
    });

    await expect(acceptClaim("claim-1", 3)).rejects.toThrow(/409 state_mismatch/);
  });
});
