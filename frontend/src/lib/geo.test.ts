import { describe, it, expect, vi, afterEach } from "vitest";
import { distanceKm, nearestCafe, reverseGeocode } from "./geo";
import { CAFES } from "@/data/cafes";

describe("distanceKm", () => {
  it("is zero for the same point", () => {
    expect(distanceKm(59.96, 30.3, 59.96, 30.3)).toBeCloseTo(0, 6);
  });

  it("is symmetric", () => {
    const a = distanceKm(59.9609, 30.3013, 59.9598, 30.2936);
    const b = distanceKm(59.9598, 30.2936, 59.9609, 30.3013);
    expect(a).toBeCloseTo(b, 9);
  });

  it("matches a known short distance (~0.5 km)", () => {
    const d = distanceKm(59.9609, 30.3013, 59.9598, 30.2936);
    expect(d).toBeGreaterThan(0.3);
    expect(d).toBeLessThan(0.8);
  });
});

describe("nearestCafe", () => {
  it("picks the branch whose own coordinates are given", () => {
    for (const cafe of CAFES) {
      expect(nearestCafe(cafe.lat, cafe.lng).id).toBe(cafe.id);
    }
  });

  it("falls back to the only branch for any point", () => {
    expect(nearestCafe(59.9, 30.3).id).toBe(CAFES[0].id);
  });
});

describe("reverseGeocode", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the display_name from a successful response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ display_name: "Санкт-Петербург, ул. Тестовая, 1" }),
      })
    );

    const result = await reverseGeocode(59.96, 30.3);
    expect(result).toBe("Санкт-Петербург, ул. Тестовая, 1");
  });

  it("returns null when the response is not ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    expect(await reverseGeocode(59.96, 30.3)).toBeNull();
  });

  it("returns null when fetch throws (offline / network error)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down"))
    );
    expect(await reverseGeocode(59.96, 30.3)).toBeNull();
  });
});
