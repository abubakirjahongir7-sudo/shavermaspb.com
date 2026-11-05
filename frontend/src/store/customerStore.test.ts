import { describe, it, expect, beforeEach } from "vitest";
import { useCustomerStore } from "./customerStore";

describe("customerStore", () => {
  beforeEach(() => {
    useCustomerStore.setState({ name: "", phone: "" });
  });

  it("starts empty", () => {
    const state = useCustomerStore.getState();
    expect(state.name).toBe("");
    expect(state.phone).toBe("");
  });

  it("setName and setPhone update independently", () => {
    useCustomerStore.getState().setName("Иван");
    expect(useCustomerStore.getState().phone).toBe("");

    useCustomerStore.getState().setPhone("+79991234567");
    expect(useCustomerStore.getState().name).toBe("Иван");
    expect(useCustomerStore.getState().phone).toBe("+79991234567");
  });
});
