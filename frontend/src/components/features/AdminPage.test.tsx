import { beforeAll, afterAll, describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { AdminPage } from "./AdminPage";
import { CAFES } from "@/data/cafes";

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
import * as api from "@/lib/api";
import type { AdminOrder } from "@/lib/api";

// jsdom'da process.env.NEXT_PUBLIC_API_BASE_URL bo'sh bo'lgani uchun,
// SSE (EventSource) ulanishini sinash uchun API_BASE_URL'ni majburan
// belgilaymiz — qolgan hamma narsa (fetchAdminOrders va h.k.) haqiqiy
// implementatsiya bo'lib qoladi, boshqa testlar bunga sezmaydi.
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, API_BASE_URL: "http://test-api.local" };
});

const now = new Date();
const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

function makeOrder(overrides: Partial<AdminOrder>): AdminOrder {
  return {
    id: 1,
    customerName: "Иван",
    phone: "+79991234567",
    items: [{ id: "sh-klassicheskaya", name: "Шаверма классическая", price: 320, quantity: 1 }],
    total: 320,
    status: "PENDING",
    deliveryFee: 0,
    paymentMethod: "CASH",
    paymentStatus: "NOT_REQUIRED",
    orderType: "PICKUP",
    cafeId: CAFES[0].id,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    ...overrides,
  };
}

const ordersToday1 = makeOrder({ id: 1, cafeId: CAFES[0].id });
const ordersToday2 = makeOrder({ id: 2, cafeId: TEST_CAFE.id }); // boshqa filial
const orderOld = makeOrder({ id: 3, cafeId: CAFES[0].id, createdAt: twoDaysAgo.toISOString() });

describe("AdminPage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("shows the login form first", () => {
    render(<AdminPage />);
    expect(screen.getByPlaceholderText("Пароль")).toBeInTheDocument();
  });

  it("switches to the 'Меню' tab and back to 'Заказы'", async () => {
    vi.spyOn(api, "fetchAdminOrders").mockResolvedValue([ordersToday1]);
    const stopListSpy = vi.spyOn(api, "fetchStopList").mockResolvedValue([]);

    render(<AdminPage />);
    fireEvent.change(screen.getByPlaceholderText("Пароль"), { target: { value: "ivan" } });
    fireEvent.click(screen.getByText("Войти"));
    await waitFor(() => expect(screen.getByText("Заказ #1")).toBeInTheDocument());

    fireEvent.click(screen.getByText("🍽 Меню"));
    expect(screen.queryByText("Заказ #1")).not.toBeInTheDocument();
    // Menu view renders the "Стоп"/"Вернуть" toggles once its own
    // stop-list fetch resolves — for the currently selected branch.
    await waitFor(() => expect(screen.getAllByText("⛔ Стоп").length).toBeGreaterThan(0));
    expect(stopListSpy).toHaveBeenCalledWith(CAFES[0].id);

    fireEvent.click(screen.getByText("📋 Заказы"));
    expect(screen.getByText("Заказ #1")).toBeInTheDocument();
  });

  it("reloads the menu stop list for the newly selected branch when switching tabs", async () => {
    vi.spyOn(api, "fetchAdminOrders").mockResolvedValue([ordersToday1, ordersToday2]);
    const stopListSpy = vi.spyOn(api, "fetchStopList").mockResolvedValue([]);

    render(<AdminPage />);
    fireEvent.change(screen.getByPlaceholderText("Пароль"), { target: { value: "ivan" } });
    fireEvent.click(screen.getByText("Войти"));
    await waitFor(() => expect(screen.getByText("Заказ #1")).toBeInTheDocument());

    fireEvent.click(screen.getByText("🍽 Меню"));
    await waitFor(() => expect(stopListSpy).toHaveBeenCalledWith(CAFES[0].id));

    fireEvent.click(screen.getByText(TEST_CAFE.name));
    await waitFor(() => expect(stopListSpy).toHaveBeenCalledWith(TEST_CAFE.id));
  });

  it("stopping an item sends the currently selected branch's cafeId", async () => {
    vi.spyOn(api, "fetchAdminOrders").mockResolvedValue([ordersToday1, ordersToday2]);
    vi.spyOn(api, "fetchStopList").mockResolvedValue([]);
    const stopSpy = vi.spyOn(api, "stopMenuItem").mockResolvedValue(undefined);

    render(<AdminPage />);
    fireEvent.change(screen.getByPlaceholderText("Пароль"), { target: { value: "ivan" } });
    fireEvent.click(screen.getByText("Войти"));
    await waitFor(() => expect(screen.getByText("Заказ #1")).toBeInTheDocument());

    fireEvent.click(screen.getByText(TEST_CAFE.name));
    fireEvent.click(screen.getByText("🍽 Меню"));
    await waitFor(() => expect(screen.getAllByText("⛔ Стоп").length).toBeGreaterThan(0));

    fireEvent.click(screen.getAllByText("⛔ Стоп")[0]);

    await waitFor(() => expect(stopSpy).toHaveBeenCalled());
    expect(stopSpy.mock.calls[0][1]).toBe(TEST_CAFE.id);
  });

  it("shows the customer's item comment when present", async () => {
    vi.spyOn(api, "fetchAdminOrders").mockResolvedValue([
      makeOrder({
        id: 4,
        items: [
          {
            id: "sh-klassicheskaya",
            name: "Шаверма классическая",
            price: 320,
            quantity: 1,
            comment: "без лука",
          },
        ],
      }),
    ]);

    render(<AdminPage />);
    fireEvent.change(screen.getByPlaceholderText("Пароль"), { target: { value: "ivan" } });
    fireEvent.click(screen.getByText("Войти"));

    await waitFor(() => expect(screen.getByText(/💬 без лука/)).toBeInTheDocument());
  });

  it("logs in, loads orders and shows only today's orders for the selected branch", async () => {
    vi.spyOn(api, "fetchAdminOrders").mockResolvedValue([ordersToday1, ordersToday2, orderOld]);

    render(<AdminPage />);
    fireEvent.change(screen.getByPlaceholderText("Пароль"), { target: { value: "ivan" } });
    fireEvent.click(screen.getByText("Войти"));

    await waitFor(() => expect(screen.getByText("Заказ #1")).toBeInTheDocument());

    // Boshqa filialga tegishli va eski (kechagi smenadan oldingi) buyurtmalar
    // standart holatda ko'rinmasligi kerak.
    expect(screen.queryByText("Заказ #2")).not.toBeInTheDocument();
    expect(screen.queryByText("Заказ #3")).not.toBeInTheDocument();
  });

  it("shows 'Неверный пароль' and returns to the login form on a wrong password", async () => {
    vi.spyOn(api, "fetchAdminOrders").mockRejectedValue(new Error("UNAUTHORIZED"));

    render(<AdminPage />);
    fireEvent.change(screen.getByPlaceholderText("Пароль"), { target: { value: "wrong" } });
    fireEvent.click(screen.getByText("Войти"));

    await waitFor(() => expect(screen.getByText("Неверный пароль")).toBeInTheDocument());
    expect(screen.getByPlaceholderText("Пароль")).toBeInTheDocument();
  });

  it("switching the branch tab filters the order list", async () => {
    vi.spyOn(api, "fetchAdminOrders").mockResolvedValue([ordersToday1, ordersToday2]);

    render(<AdminPage />);
    fireEvent.change(screen.getByPlaceholderText("Пароль"), { target: { value: "ivan" } });
    fireEvent.click(screen.getByText("Войти"));
    await waitFor(() => expect(screen.getByText("Заказ #1")).toBeInTheDocument());

    fireEvent.click(screen.getByText(TEST_CAFE.name));

    await waitFor(() => expect(screen.getByText("Заказ #2")).toBeInTheDocument());
    expect(screen.queryByText("Заказ #1")).not.toBeInTheDocument();
  });

  it("'Вся история' reveals orders from before the shift cutoff", async () => {
    vi.spyOn(api, "fetchAdminOrders").mockResolvedValue([ordersToday1, orderOld]);

    render(<AdminPage />);
    fireEvent.change(screen.getByPlaceholderText("Пароль"), { target: { value: "ivan" } });
    fireEvent.click(screen.getByText("Войти"));
    await waitFor(() => expect(screen.getByText("Заказ #1")).toBeInTheDocument());

    expect(screen.queryByText("Заказ #3")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Вся история"));

    await waitFor(() => expect(screen.getByText("Заказ #3")).toBeInTheDocument());
  });

  it("changing an order's status calls the API and updates the row", async () => {
    vi.spyOn(api, "fetchAdminOrders").mockResolvedValue([ordersToday1]);
    const updateSpy = vi
      .spyOn(api, "updateAdminOrderStatus")
      .mockResolvedValue(makeOrder({ id: 1, status: "CONFIRMED" }));

    render(<AdminPage />);
    fireEvent.change(screen.getByPlaceholderText("Пароль"), { target: { value: "ivan" } });
    fireEvent.click(screen.getByText("Войти"));
    await waitFor(() => expect(screen.getByText("Заказ #1")).toBeInTheDocument());

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "CONFIRMED" } });

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith("ivan", 1, "CONFIRMED");
    });
  });

  describe("auto-refresh", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("polls for new orders on its own, without clicking 'Обновить'", async () => {
      const fetchSpy = vi
        .spyOn(api, "fetchAdminOrders")
        .mockResolvedValueOnce([]) // dastlabki yuklash — hali buyurtma yo'q
        .mockResolvedValueOnce([ordersToday1]); // mijoz shu orada buyurtma berdi

      render(<AdminPage />);
      fireEvent.change(screen.getByPlaceholderText("Пароль"), { target: { value: "ivan" } });
      fireEvent.click(screen.getByText("Войти"));

      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(screen.getByText("Заказов пока нет.")).toBeInTheDocument();
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      // Mijoz bosqonchasiz — panel o'zi keyingi pollingda yangi buyurtmani topadi.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(5000);
      });

      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(screen.getByText("Заказ #1")).toBeInTheDocument();
    });

    it("refreshes immediately when the tab/screen becomes visible again", async () => {
      const fetchSpy = vi
        .spyOn(api, "fetchAdminOrders")
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([ordersToday1]);

      render(<AdminPage />);
      fireEvent.change(screen.getByPlaceholderText("Пароль"), { target: { value: "ivan" } });
      fireEvent.click(screen.getByText("Войти"));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      Object.defineProperty(document, "visibilityState", {
        value: "visible",
        configurable: true,
      });
      await act(async () => {
        document.dispatchEvent(new Event("visibilitychange"));
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(screen.getByText("Заказ #1")).toBeInTheDocument();
    });
  });

  describe("real-time push (SSE)", () => {
    class FakeEventSource {
      static instances: FakeEventSource[] = [];
      url: string;
      listeners: Record<string, Array<() => void>> = {};
      closed = false;

      constructor(url: string) {
        this.url = url;
        FakeEventSource.instances.push(this);
      }

      addEventListener(event: string, cb: () => void) {
        (this.listeners[event] ??= []).push(cb);
      }

      emit(event: string) {
        for (const cb of this.listeners[event] ?? []) cb();
      }

      close() {
        this.closed = true;
      }
    }

    beforeEach(() => {
      FakeEventSource.instances = [];
      vi.stubGlobal("EventSource", FakeEventSource);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("subscribes with the admin password and refreshes the moment a new-order event arrives", async () => {
      const fetchSpy = vi
        .spyOn(api, "fetchAdminOrders")
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([ordersToday1]);

      render(<AdminPage />);
      fireEvent.change(screen.getByPlaceholderText("Пароль"), { target: { value: "ivan" } });
      fireEvent.click(screen.getByText("Войти"));
      await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
      expect(screen.getByText("Заказов пока нет.")).toBeInTheDocument();

      expect(FakeEventSource.instances).toHaveLength(1);
      expect(FakeEventSource.instances[0].url).toContain("token=ivan");

      // Mijoz buyurtma berdi — backend SSE orqali signal yuboradi (bu
      // yerda soxta EventSource orqali simulyatsiya qilinadi), taymer
      // yoki qo'lda bosishni kutmasdan.
      await act(async () => {
        FakeEventSource.instances[0].emit("new-order");
      });

      await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2));
      expect(screen.getByText("Заказ #1")).toBeInTheDocument();
    });

    it("closes the connection on logout", async () => {
      vi.spyOn(api, "fetchAdminOrders").mockResolvedValue([]);

      render(<AdminPage />);
      fireEvent.change(screen.getByPlaceholderText("Пароль"), { target: { value: "ivan" } });
      fireEvent.click(screen.getByText("Войти"));
      await waitFor(() => expect(FakeEventSource.instances).toHaveLength(1));

      fireEvent.click(screen.getByText("Выйти"));

      expect(FakeEventSource.instances[0].closed).toBe(true);
    });
  });

  describe("screen wake lock (kafe monitori uchun)", () => {
    function stubWakeLock() {
      const sentinel = { release: vi.fn().mockResolvedValue(undefined) };
      const request = vi.fn().mockResolvedValue(sentinel);
      Object.defineProperty(navigator, "wakeLock", {
        value: { request },
        configurable: true,
      });
      return { request, sentinel };
    }

    afterEach(() => {
      // @ts-expect-error — testda qo'shilgan mock'ni tozalash
      delete navigator.wakeLock;
    });

    it("requests a screen wake lock once logged in", async () => {
      const { request } = stubWakeLock();
      vi.spyOn(api, "fetchAdminOrders").mockResolvedValue([]);

      render(<AdminPage />);
      fireEvent.change(screen.getByPlaceholderText("Пароль"), { target: { value: "ivan" } });
      fireEvent.click(screen.getByText("Войти"));

      await waitFor(() => expect(request).toHaveBeenCalledWith("screen"));
    });

    it("releases the wake lock on logout", async () => {
      const { sentinel } = stubWakeLock();
      vi.spyOn(api, "fetchAdminOrders").mockResolvedValue([]);

      render(<AdminPage />);
      fireEvent.change(screen.getByPlaceholderText("Пароль"), { target: { value: "ivan" } });
      fireEvent.click(screen.getByText("Войти"));
      await waitFor(() => expect(sentinel.release).not.toHaveBeenCalled());

      fireEvent.click(screen.getByText("Выйти"));

      await waitFor(() => expect(sentinel.release).toHaveBeenCalled());
    });

    it("doesn't crash on browsers without the Wake Lock API", async () => {
      vi.spyOn(api, "fetchAdminOrders").mockResolvedValue([]);

      render(<AdminPage />);
      fireEvent.change(screen.getByPlaceholderText("Пароль"), { target: { value: "ivan" } });
      fireEvent.click(screen.getByText("Войти"));

      await waitFor(() => expect(screen.getByText("Заказов пока нет.")).toBeInTheDocument());
    });
  });

  describe("lockedCafeId (bitta filialga qulflangan alohida admin panel)", () => {
    it("hides the branch switcher and only shows that branch's orders", async () => {
      vi.spyOn(api, "fetchAdminOrders").mockResolvedValue([ordersToday1, ordersToday2]);

      render(<AdminPage lockedCafeId={CAFES[0].id} />);
      fireEvent.change(screen.getByPlaceholderText("Пароль"), { target: { value: "ivan" } });
      fireEvent.click(screen.getByText("Войти"));

      await waitFor(() => expect(screen.getByText("Заказ #1")).toBeInTheDocument());
      expect(screen.queryByText("Заказ #2")).not.toBeInTheDocument();
      // Boshqa filial tugmasi umuman ko'rinmasligi kerak.
      expect(screen.queryByText(TEST_CAFE.name)).not.toBeInTheDocument();
    });

    it("shows the locked branch's name next to the page title", async () => {
      vi.spyOn(api, "fetchAdminOrders").mockResolvedValue([]);

      render(<AdminPage lockedCafeId={CAFES[0].id} />);
      fireEvent.change(screen.getByPlaceholderText("Пароль"), { target: { value: "ivan" } });
      fireEvent.click(screen.getByText("Войти"));

      await waitFor(() =>
        expect(screen.getByText(new RegExp(CAFES[0].name))).toBeInTheDocument()
      );
    });

    it("ignores a different branch remembered in localStorage and stays locked", async () => {
      localStorage.setItem("admin_cafe_id", TEST_CAFE.id);
      vi.spyOn(api, "fetchAdminOrders").mockResolvedValue([ordersToday1, ordersToday2]);

      render(<AdminPage lockedCafeId={CAFES[0].id} />);
      fireEvent.change(screen.getByPlaceholderText("Пароль"), { target: { value: "ivan" } });
      fireEvent.click(screen.getByText("Войти"));

      await waitFor(() => expect(screen.getByText("Заказ #1")).toBeInTheDocument());
      expect(screen.queryByText("Заказ #2")).not.toBeInTheDocument();
    });
  });

  describe("ringtone (new order alert)", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.mocked(window.HTMLMediaElement.prototype.play).mockClear();
      vi.mocked(window.HTMLMediaElement.prototype.pause).mockClear();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("plays (loops) the ringtone while there is an unaccepted ('Новый') order", async () => {
      vi.spyOn(api, "fetchAdminOrders").mockResolvedValue([ordersToday1]); // status: PENDING

      render(<AdminPage />);
      fireEvent.change(screen.getByPlaceholderText("Пароль"), { target: { value: "ivan" } });
      fireEvent.click(screen.getByText("Войти"));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(screen.getByText("🔔 Новый заказ — нажмите «Принять»")).toBeInTheDocument();
      expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalled();
    });

    it("stays quiet when there are no pending orders", async () => {
      vi.spyOn(api, "fetchAdminOrders").mockResolvedValue([
        makeOrder({ id: 9, status: "CONFIRMED" }),
      ]);

      render(<AdminPage />);
      fireEvent.change(screen.getByPlaceholderText("Пароль"), { target: { value: "ivan" } });
      fireEvent.click(screen.getByText("Войти"));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(screen.queryByText("🔔 Новый заказ — нажмите «Принять»")).not.toBeInTheDocument();
      // Asosiy kafolat: bo'lmagan-narsani chalib yubormasligi — pause()
      // chaqirilishi shart emas (hech qachon play bo'lmagan bo'lsa).
      expect(window.HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
    });

    it("'✅ Принять' accepts the order and stops the ringtone", async () => {
      vi.spyOn(api, "fetchAdminOrders").mockResolvedValue([ordersToday1]);
      vi.spyOn(api, "updateAdminOrderStatus").mockResolvedValue(
        makeOrder({ id: 1, status: "CONFIRMED" })
      );

      render(<AdminPage />);
      fireEvent.change(screen.getByPlaceholderText("Пароль"), { target: { value: "ivan" } });
      fireEvent.click(screen.getByText("Войти"));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(screen.getByText("✅ Принять")).toBeInTheDocument();
      vi.mocked(window.HTMLMediaElement.prototype.pause).mockClear();

      await act(async () => {
        fireEvent.click(screen.getByText("✅ Принять"));
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(api.updateAdminOrderStatus).toHaveBeenCalledWith("ivan", 1, "CONFIRMED");
      expect(screen.queryByText("✅ Принять")).not.toBeInTheDocument();
      expect(window.HTMLMediaElement.prototype.pause).toHaveBeenCalled();
    });

    it("keeps ringing if one of two pending orders is accepted but the other isn't", async () => {
      const other = makeOrder({ id: 2, cafeId: CAFES[0].id });
      vi.spyOn(api, "fetchAdminOrders").mockResolvedValue([ordersToday1, other]);
      vi.spyOn(api, "updateAdminOrderStatus").mockResolvedValue(
        makeOrder({ id: 1, status: "CONFIRMED" })
      );

      render(<AdminPage />);
      fireEvent.change(screen.getByPlaceholderText("Пароль"), { target: { value: "ivan" } });
      fireEvent.click(screen.getByText("Войти"));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });

      const acceptButtons = screen.getAllByText("✅ Принять");
      expect(acceptButtons).toHaveLength(2);
      vi.mocked(window.HTMLMediaElement.prototype.pause).mockClear();

      await act(async () => {
        fireEvent.click(acceptButtons[0]);
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(screen.getByText("🔔 Новый заказ — нажмите «Принять»")).toBeInTheDocument();
      expect(window.HTMLMediaElement.prototype.pause).not.toHaveBeenCalled();
    });

    it("shows a visible warning when the browser silently blocks autoplay", async () => {
      vi.mocked(window.HTMLMediaElement.prototype.play).mockRejectedValueOnce(
        new Error("NotAllowedError")
      );
      vi.spyOn(api, "fetchAdminOrders").mockResolvedValue([ordersToday1]);

      render(<AdminPage />);
      fireEvent.change(screen.getByPlaceholderText("Пароль"), { target: { value: "ivan" } });
      fireEvent.click(screen.getByText("Войти"));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(
        screen.getByText("🔇 Звук заблокирован браузером — нажмите здесь, чтобы включить")
      ).toBeInTheDocument();
    });

    it("does not show the sound-blocked warning once the ringtone plays normally", async () => {
      vi.spyOn(api, "fetchAdminOrders").mockResolvedValue([ordersToday1]);

      render(<AdminPage />);
      fireEvent.change(screen.getByPlaceholderText("Пароль"), { target: { value: "ivan" } });
      fireEvent.click(screen.getByText("Войти"));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(
        screen.queryByText("🔇 Звук заблокирован браузером — нажмите здесь, чтобы включить")
      ).not.toBeInTheDocument();
    });

    it("retries and clears the warning on the next tap anywhere on the page", async () => {
      vi.mocked(window.HTMLMediaElement.prototype.play).mockRejectedValueOnce(
        new Error("NotAllowedError")
      );
      vi.spyOn(api, "fetchAdminOrders").mockResolvedValue([ordersToday1]);

      render(<AdminPage />);
      fireEvent.change(screen.getByPlaceholderText("Пароль"), { target: { value: "ivan" } });
      fireEvent.click(screen.getByText("Войти"));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(
        screen.getByText("🔇 Звук заблокирован браузером — нажмите здесь, чтобы включить")
      ).toBeInTheDocument();

      await act(async () => {
        fireEvent.pointerDown(document.body);
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(
        screen.queryByText("🔇 Звук заблокирован браузером — нажмите здесь, чтобы включить")
      ).not.toBeInTheDocument();
    });
  });
});
