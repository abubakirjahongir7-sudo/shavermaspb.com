import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { OrderStatusPage } from "./OrderStatusPage";
import { useMyOrdersStore } from "@/store/myOrdersStore";
import * as api from "@/lib/api";
import type { TrackedOrder } from "@/lib/api";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

vi.mock("@/hooks/useOrderPush", () => ({
  useOrderPush: () => ({ status: "off", enable: vi.fn() }),
}));

function order(overrides: Partial<TrackedOrder> = {}): TrackedOrder {
  return {
    id: 42,
    status: "CONFIRMED",
    deliveryFee: 0,
    paymentMethod: "CASH",
    paymentStatus: "NOT_REQUIRED",
    orderType: "PICKUP",
    cafeId: "grazhdanskiy-39b",
    address: null,
    items: [{ id: "sh-klassicheskaya", name: "Шаверма классическая", price: 320, quantity: 2, comment: "без лука" }],
    total: 640,
    customerName: "Иван",
    createdAt: "2026-10-15T10:00:00.000Z",
    updatedAt: "2026-10-15T10:00:00.000Z",
    ...overrides,
  };
}

describe("OrderStatusPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useMyOrdersStore.setState({ orders: [] });
  });

  it("shows the order's progress, items and the push button", async () => {
    const spy = vi.spyOn(api, "fetchTrackedOrder").mockResolvedValue(order());

    render(<OrderStatusPage orderId={42} token="tok" />);

    await waitFor(() => expect(screen.getByText("Заказ #42")).toBeInTheDocument());
    expect(spy).toHaveBeenCalledWith(42, "tok");
    expect(screen.getByText("Принят — готовим")).toBeInTheDocument();
    expect(screen.getByText("Готов — можно забирать")).toBeInTheDocument();
    expect(screen.getByText(/без лука/)).toBeInTheDocument();
    expect(screen.getByText("🔔 Сообщить, когда заказ будет готов")).toBeInTheDocument();
    // Shu qurilmada keyin ham topish uchun eslab qolinadi.
    expect(useMyOrdersStore.getState().orders[0]).toMatchObject({ id: 42, token: "tok" });
  });

  it("falls back to the token saved on this device when the link has none", async () => {
    useMyOrdersStore.setState({ orders: [{ id: 42, token: "saved", createdAt: "x" }] });
    const spy = vi.spyOn(api, "fetchTrackedOrder").mockResolvedValue(order());

    render(<OrderStatusPage orderId={42} token="" />);

    await waitFor(() => expect(spy).toHaveBeenCalledWith(42, "saved"));
  });

  it("shows a cancelled order without the push button", async () => {
    vi.spyOn(api, "fetchTrackedOrder").mockResolvedValue(order({ status: "CANCELLED" }));

    render(<OrderStatusPage orderId={42} token="tok" />);

    await waitFor(() => expect(screen.getByText("Заказ отменён")).toBeInTheDocument());
    expect(screen.queryByText(/Сообщить, когда/)).not.toBeInTheDocument();
  });

  it("says the order was not found for a wrong token", async () => {
    vi.spyOn(api, "fetchTrackedOrder").mockResolvedValue(null);

    render(<OrderStatusPage orderId={42} token="wrong" />);

    await waitFor(() => expect(screen.getByText("Заказ не найден")).toBeInTheDocument());
  });
});
