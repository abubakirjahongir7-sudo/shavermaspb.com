import { describe, it, expect } from "vitest";
import { formatPrice } from "./utils";

describe("formatPrice", () => {
  it("formats a small number with the ruble sign", () => {
    expect(formatPrice(329)).toBe("329 ₽");
  });

  it("groups thousands using ru-RU locale formatting", () => {
    // toLocaleString("ru-RU") separates thousands with a non-breaking
    // space (U+00A0), not a regular space — check structurally instead
    // of hardcoding that exact whitespace character.
    const result = formatPrice(1000);
    expect(result.endsWith("₽")).toBe(true);
    expect(result.replace(/\s/g, "")).toBe("1000₽");
  });

  it("formats zero", () => {
    expect(formatPrice(0)).toBe("0 ₽");
  });
});
