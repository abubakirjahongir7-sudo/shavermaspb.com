import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CartPage } from "./CartPage";
import { useCartStore } from "@/store/cartStore";
import { useCustomerStore } from "@/store/customerStore";
import { useOrderStore } from "@/store/orderStore";
import { useMyOrdersStore } from "@/store/myOrdersStore";
import { CAFES } from "@/data/cafes";
import { menuItems } from "@/data/menuItems";
import * as api from "@/lib/api";

const push = vi.fn();
const back = vi.fn();
const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, back, replace }),
}));

const shaverma = menuItems.find((i) => i.id === "sh-klassicheskaya")!;
const okResult = (orderId: number) => ({ orderId, trackingToken: "tok-123", customerName: "Иван" });

function resetStores() {
  useCartStore.setState({ items: {} });
  useCustomerStore.setState({ name: "", phone: "" });
  useMyOrdersStore.setState({ orders: [] });
  replace.mockClear();
  useOrderStore.setState({
    fulfillmentType: "PICKUP",
    cafeId: CAFES[0].id,
    address: "",
    coords: null,
    autoSelected: true,
  });
  push.mockClear();
  back.mockClear();
}

describe("CartPage", () => {
  beforeEach(() => {
    resetStores();
    vi.restoreAllMocks();
  });

  it("shows an empty-cart message when there is nothing to order", () => {
    render(<CartPage />);
    expect(screen.getByText("Ваша корзина пуста. Выберите товар из меню.")).toBeInTheDocument();
    expect(screen.queryByText("Заказать")).not.toBeInTheDocument();
  });

  it("asks for name + phone before checkout is enabled", () => {
    useCartStore.getState().add(shaverma);
    render(<CartPage />);

    expect(screen.getByPlaceholderText("Ваше имя")).toBeInTheDocument();
    expect(screen.getByText("Заказать")).toBeDisabled();
  });

  it("blocks checkout with an error when delivery has no address (defensive path)", () => {
    useCartStore.getState().add(shaverma);
    useCustomerStore.setState({ name: "Иван", phone: "+79991234567" });
    useOrderStore.setState({ fulfillmentType: "DELIVERY", address: "" });

    render(<CartPage />);
    // Kuryer naqd pul olmaydi — yetkazib berishda naqd varianti ko'rsatilmaydi.
    expect(screen.queryByText(/Оплата наличными/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Оплатить и заказать"));

    expect(
      screen.getByText("Укажите адрес доставки перед оформлением заказа.")
    ).toBeInTheDocument();
  });

  it("submits the order, remembers it, and opens its live status page", async () => {
    useCartStore.getState().add(shaverma);
    useCustomerStore.setState({ name: "Иван", phone: "+79991234567" });

    const submitOrderSpy = vi.spyOn(api, "submitOrder").mockResolvedValue(okResult(123));

    render(<CartPage />);
    fireEvent.click(screen.getByText("Заказать"));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/order/123?t=tok-123"));

    expect(submitOrderSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        orderType: "PICKUP",
        cafeId: CAFES[0].id,
        customerName: "Иван",
        phone: "+79991234567",
      })
    );
    expect(useMyOrdersStore.getState().orders[0]).toMatchObject({ id: 123, token: "tok-123" });
    // The cart must be emptied once the order is placed.
    expect(useCartStore.getState().items).toEqual({});
  });

  it("shows a retry-friendly error and re-enables the button if the request fails", async () => {
    useCartStore.getState().add(shaverma);
    useCustomerStore.setState({ name: "Иван", phone: "+79991234567" });
    vi.spyOn(api, "submitOrder").mockRejectedValue(new Error("network down"));

    render(<CartPage />);
    fireEvent.click(screen.getByText("Заказать"));

    await waitFor(() => {
      expect(screen.getByText(/Не удалось отправить заказ/)).toBeInTheDocument();
    });
    expect(screen.getByText("Заказать")).not.toBeDisabled();
    // A failed order must NOT clear the cart — the customer would lose it.
    expect(useCartStore.getState().items[shaverma.id]).toBeDefined();
  });

  it("lets the customer add a comment to an item and includes it in the order", async () => {
    useCartStore.getState().add(shaverma);
    useCustomerStore.setState({ name: "Иван", phone: "+79991234567" });
    const submitOrderSpy = vi.spyOn(api, "submitOrder").mockResolvedValue(okResult(1));

    render(<CartPage />);

    fireEvent.click(screen.getByText("💬 Добавить комментарий"));
    fireEvent.change(screen.getByPlaceholderText("Например: без лука, соус отдельно…"), {
      target: { value: "без лука" },
    });
    fireEvent.click(screen.getByText("Заказать"));

    await waitFor(() => expect(submitOrderSpy).toHaveBeenCalled());
    expect(submitOrderSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [expect.objectContaining({ id: shaverma.id, comment: "без лука" })],
      })
    );
  });

  it("shows the saved comment as the toggle's label once collapsed", () => {
    useCartStore.getState().add(shaverma);
    useCartStore.getState().setComment(shaverma.id, "без лука");
    render(<CartPage />);

    expect(screen.getByText("💬 без лука")).toBeInTheDocument();
  });
});
