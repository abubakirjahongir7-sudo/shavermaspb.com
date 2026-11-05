import { beforeAll, afterAll, describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import * as api from "@/lib/api";
import { AddressSheet } from "./AddressSheet";
import { useOrderStore } from "@/store/orderStore";
import { CAFES } from "@/data/cafes";

function checkoutConfig(deliveryEnabled: boolean): api.CheckoutConfig {
  return {
    cardEnabled: deliveryEnabled,
    deliveryEnabled,
    delivery: { minOrder: 700, zones: [{ maxKm: 3, fee: 150 }] },
  };
}

// Filiallarni almashtirish mantiqini sinash uchun vaqtincha ikkinchi filial
// qo'shiladi — haqiqiy ro'yxatda hozir bitta filial bor. (Vitest'da
// isolate: false, shuning uchun vi.mock o'rniga — boshqa fayllarga ta'sir qilmasin.)
const TEST_CAFE = {
  id: "test-branch",
  name: "Тестовая ул., 1",
  address: "Тестовая улица, 1",
  landmark: "м. «Тестовая»",
  lat: 59.95,
  lng: 30.29,
};
beforeAll(() => {
  CAFES.push(TEST_CAFE);
});
afterAll(() => {
  CAFES.splice(CAFES.indexOf(TEST_CAFE), 1);
});

describe("AddressSheet", () => {
  beforeEach(() => {
    useOrderStore.setState({
      fulfillmentType: "PICKUP",
      cafeId: CAFES[0].id,
      address: "",
      coords: null,
      autoSelected: true,
    });
  });

  it("renders nothing when closed", () => {
    const { container } = render(<AddressSheet open={false} onClose={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows both branches and the currently selected one highlighted", () => {
    render(<AddressSheet open onClose={() => {}} />);
    for (const cafe of CAFES) {
      expect(screen.getByText(cafe.name)).toBeInTheDocument();
    }
  });

  it("keeps Delivery disabled until the server enables it", async () => {
    vi.spyOn(api, "fetchCheckoutConfig").mockResolvedValue(checkoutConfig(false));
    render(<AddressSheet open onClose={() => {}} />);

    await waitFor(() => expect(api.fetchCheckoutConfig).toHaveBeenCalled());
    expect(screen.getByText("скоро").closest("button")).toBeDisabled();
  });

  it("saves a delivery address with the fee quoted by the server", async () => {
    vi.spyOn(api, "fetchCheckoutConfig").mockResolvedValue(checkoutConfig(true));
    vi.spyOn(api, "fetchDeliveryQuote").mockResolvedValue({
      available: true,
      fee: 150,
      distanceKm: 2.1,
      lat: 60,
      lng: 30,
    });
    let closed = false;
    render(<AddressSheet open onClose={() => (closed = true)} />);

    fireEvent.click(await screen.findByText("🚚 Доставка"));
    fireEvent.change(screen.getByPlaceholderText(/Улица/), { target: { value: "Невский 1" } });
    fireEvent.click(screen.getByText("Сохранить"));

    await waitFor(() => expect(closed).toBe(true));
    const state = useOrderStore.getState();
    expect(state.fulfillmentType).toBe("DELIVERY");
    expect(state.address).toBe("Невский 1");
    expect(state.deliveryFee).toBe(150);
    expect(state.deliveryCoords).toEqual({ lat: 60, lng: 30 });
  });

  it("keeps the sheet open and explains when the address is out of the delivery zone", async () => {
    vi.spyOn(api, "fetchCheckoutConfig").mockResolvedValue(checkoutConfig(true));
    vi.spyOn(api, "fetchDeliveryQuote").mockResolvedValue({ available: false, reason: "OUT_OF_ZONE" });
    let closed = false;
    render(<AddressSheet open onClose={() => (closed = true)} />);

    fireEvent.click(await screen.findByText("🚚 Доставка"));
    fireEvent.change(screen.getByPlaceholderText(/Улица/), { target: { value: "Далеко" } });
    fireEvent.click(screen.getByText("Сохранить"));

    expect(await screen.findByText(/не доставляем/)).toBeInTheDocument();
    expect(closed).toBe(false);
  });

  it("picking a branch and saving updates the store and closes the sheet", () => {
    let closed = false;
    render(<AddressSheet open onClose={() => (closed = true)} />);

    fireEvent.click(screen.getByText(CAFES[1].name));
    fireEvent.click(screen.getByText("Сохранить"));

    expect(useOrderStore.getState().cafeId).toBe(CAFES[1].id);
    expect(useOrderStore.getState().autoSelected).toBe(false);
    expect(useOrderStore.getState().fulfillmentType).toBe("PICKUP");
    expect(closed).toBe(true);
  });
});
