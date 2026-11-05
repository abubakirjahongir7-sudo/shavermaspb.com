import { describe, it, expect, beforeEach } from "vitest";
import { useOrderStore } from "./orderStore";
import { CAFES } from "@/data/cafes";

// Ro'yxatda bitta filial bo'lsa ham, tanlov mantiqini tekshirish uchun.
const OTHER_CAFE_ID = "other-branch";

describe("orderStore", () => {
  beforeEach(() => {
    useOrderStore.setState({
      fulfillmentType: "PICKUP",
      cafeId: CAFES[0].id,
      address: "",
      coords: null,
      autoSelected: true,
    });
  });

  it("defaults to pickup at the first branch, auto-selected", () => {
    const state = useOrderStore.getState();
    expect(state.fulfillmentType).toBe("PICKUP");
    expect(state.cafeId).toBe(CAFES[0].id);
    expect(state.autoSelected).toBe(true);
  });

  it("setCafeId(id, false) — an automatic pick (e.g. from GPS) — keeps autoSelected true", () => {
    useOrderStore.getState().setCafeId(OTHER_CAFE_ID, false);
    const state = useOrderStore.getState();
    expect(state.cafeId).toBe(OTHER_CAFE_ID);
    expect(state.autoSelected).toBe(true);
  });

  it("setCafeId(id, true) — a manual pick from the sheet — turns autoSelected off", () => {
    useOrderStore.getState().setCafeId(OTHER_CAFE_ID, true);
    const state = useOrderStore.getState();
    expect(state.cafeId).toBe(OTHER_CAFE_ID);
    expect(state.autoSelected).toBe(false);
  });

  it("once autoSelected is off, GPS updates must not silently override the manual choice", () => {
    // This mirrors the actual call site in LocationBar/AddressSheet: GPS
    // updates only call setCafeId(id, false) when state.autoSelected is
    // still true. Once the customer manually picks a branch, that gate
    // must stay closed for the rest of the session.
    useOrderStore.getState().setCafeId(OTHER_CAFE_ID, true);
    expect(useOrderStore.getState().autoSelected).toBe(false);
  });

  it("setFulfillmentType switches between pickup and delivery", () => {
    useOrderStore.getState().setFulfillmentType("DELIVERY");
    expect(useOrderStore.getState().fulfillmentType).toBe("DELIVERY");
  });

  it("setAddress and setCoords store their values independently of cafe selection", () => {
    useOrderStore.getState().setAddress("ул. Тестовая, д. 1");
    useOrderStore.getState().setCoords({ lat: 59.96, lng: 30.3 });

    const state = useOrderStore.getState();
    expect(state.address).toBe("ул. Тестовая, д. 1");
    expect(state.coords).toEqual({ lat: 59.96, lng: 30.3 });
    expect(state.cafeId).toBe(CAFES[0].id);
  });
});
