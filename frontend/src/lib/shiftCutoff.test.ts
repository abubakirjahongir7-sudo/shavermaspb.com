import { describe, it, expect } from "vitest";
import { getShiftCutoff } from "./shiftCutoff";

describe("getShiftCutoff", () => {
  it("returns today's 10:00 when it's currently after 10:00", () => {
    const now = new Date(2026, 8, 11, 14, 30); // 11-sen, 14:30
    const cutoff = getShiftCutoff(now);

    expect(cutoff.getDate()).toBe(11);
    expect(cutoff.getHours()).toBe(10);
    expect(cutoff.getMinutes()).toBe(0);
  });

  it("returns yesterday's 10:00 when it's currently before 10:00 (night shift)", () => {
    const now = new Date(2026, 8, 11, 2, 15); // 11-sen, 02:15 (tungi smena)
    const cutoff = getShiftCutoff(now);

    expect(cutoff.getDate()).toBe(10);
    expect(cutoff.getHours()).toBe(10);
  });

  it("treats exactly 10:00:00 as the start of today's shift", () => {
    const now = new Date(2026, 8, 11, 10, 0, 0, 0);
    const cutoff = getShiftCutoff(now);
    expect(cutoff.getTime()).toBe(now.getTime());
  });

  it("handles the day/month boundary correctly", () => {
    const now = new Date(2026, 9, 1, 3, 0); // 1-okt, 03:00 -> kechagi (30-sen) 10:00
    const cutoff = getShiftCutoff(now);
    expect(cutoff.getMonth()).toBe(8); // sentabr (0-indexed)
    expect(cutoff.getDate()).toBe(30);
  });
});
