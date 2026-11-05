import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MenuStopList } from "./MenuStopList";
import { menuItems } from "@/data/menuItems";
import * as api from "@/lib/api";

const firstItem = menuItems[0];
const CAFE_A = "grazhdanskiy-39b";
const CAFE_B = "pionerskaya-37";

function getRowFor(name: string) {
  return screen.getByText(name).closest("div") as HTMLElement;
}

describe("MenuStopList", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("lists menu items with a 'Стоп' button by default", async () => {
    vi.spyOn(api, "fetchStopList").mockResolvedValue([]);
    render(<MenuStopList password="ivan" cafeId={CAFE_A} />);

    await waitFor(() => expect(screen.getByText(firstItem.name)).toBeInTheDocument());
    expect(within(getRowFor(firstItem.name)).getByText("⛔ Стоп")).toBeInTheDocument();
  });

  it("loads the stop list for the given cafe", async () => {
    const spy = vi.spyOn(api, "fetchStopList").mockResolvedValue([]);
    render(<MenuStopList password="ivan" cafeId={CAFE_A} />);

    await waitFor(() => expect(spy).toHaveBeenCalledWith(CAFE_A));
  });

  it("shows already-stopped items with a 'Вернуть' button", async () => {
    vi.spyOn(api, "fetchStopList").mockResolvedValue([firstItem.id]);
    render(<MenuStopList password="ivan" cafeId={CAFE_A} />);

    await waitFor(() => expect(screen.getByText(firstItem.name)).toBeInTheDocument());
    expect(within(getRowFor(firstItem.name)).getByText("↩ Вернуть")).toBeInTheDocument();
  });

  it("stops an item and flips the button to 'Вернуть'", async () => {
    vi.spyOn(api, "fetchStopList").mockResolvedValue([]);
    const stopSpy = vi.spyOn(api, "stopMenuItem").mockResolvedValue(undefined);

    render(<MenuStopList password="ivan" cafeId={CAFE_A} />);
    await waitFor(() => expect(screen.getByText(firstItem.name)).toBeInTheDocument());

    fireEvent.click(within(getRowFor(firstItem.name)).getByText("⛔ Стоп"));

    await waitFor(() =>
      expect(within(getRowFor(firstItem.name)).getByText("↩ Вернуть")).toBeInTheDocument()
    );
    expect(stopSpy).toHaveBeenCalledWith("ivan", CAFE_A, firstItem.id);
  });

  it("restores a stopped item and flips the button back to 'Стоп'", async () => {
    vi.spyOn(api, "fetchStopList").mockResolvedValue([firstItem.id]);
    const unstopSpy = vi.spyOn(api, "unstopMenuItem").mockResolvedValue(undefined);

    render(<MenuStopList password="ivan" cafeId={CAFE_A} />);
    await waitFor(() => expect(screen.getByText(firstItem.name)).toBeInTheDocument());

    fireEvent.click(within(getRowFor(firstItem.name)).getByText("↩ Вернуть"));

    await waitFor(() =>
      expect(within(getRowFor(firstItem.name)).getByText("⛔ Стоп")).toBeInTheDocument()
    );
    expect(unstopSpy).toHaveBeenCalledWith("ivan", CAFE_A, firstItem.id);
  });

  it("shows an error and keeps the previous state if the toggle request fails", async () => {
    vi.spyOn(api, "fetchStopList").mockResolvedValue([]);
    vi.spyOn(api, "stopMenuItem").mockRejectedValue(new Error("network"));

    render(<MenuStopList password="ivan" cafeId={CAFE_A} />);
    await waitFor(() => expect(screen.getByText(firstItem.name)).toBeInTheDocument());

    fireEvent.click(within(getRowFor(firstItem.name)).getByText("⛔ Стоп"));

    await waitFor(() =>
      expect(screen.getByText("Не удалось изменить статус товара")).toBeInTheDocument()
    );
    expect(within(getRowFor(firstItem.name)).getByText("⛔ Стоп")).toBeInTheDocument();
  });

  it("reloads the stop list for the new cafe when cafeId changes", async () => {
    const spy = vi.spyOn(api, "fetchStopList").mockImplementation(async (cafeId) =>
      cafeId === CAFE_A ? [firstItem.id] : []
    );

    const { rerender } = render(<MenuStopList password="ivan" cafeId={CAFE_A} />);
    await waitFor(() =>
      expect(within(getRowFor(firstItem.name)).getByText("↩ Вернуть")).toBeInTheDocument()
    );

    rerender(<MenuStopList password="ivan" cafeId={CAFE_B} />);

    await waitFor(() => expect(spy).toHaveBeenCalledWith(CAFE_B));
    await waitFor(() =>
      expect(within(getRowFor(firstItem.name)).getByText("⛔ Стоп")).toBeInTheDocument()
    );
  });
});
