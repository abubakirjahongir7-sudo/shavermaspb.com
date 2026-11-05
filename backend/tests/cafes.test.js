import { describe, it, expect } from "vitest";
import { CAFES, findCafe } from "../src/data/cafes.js";

describe("data/cafes", () => {
  it("has exactly the one known branch", () => {
    expect(CAFES.map((c) => c.id)).toEqual(["grazhdanskiy-39b"]);
  });

  it("finds a cafe by id", () => {
    const cafe = findCafe("grazhdanskiy-39b");
    expect(cafe).toBeDefined();
    expect(cafe.name).toBe("Гражданский пр., 39Б");
  });

  it("returns undefined for an unknown id", () => {
    expect(findCafe("does-not-exist")).toBeUndefined();
  });

  it("returns undefined when no id is given", () => {
    expect(findCafe(undefined)).toBeUndefined();
    expect(findCafe(null)).toBeUndefined();
  });
});
