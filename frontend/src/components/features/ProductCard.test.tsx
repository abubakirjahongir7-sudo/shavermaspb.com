import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProductCard } from "./ProductCard";
import type { MenuItem } from "@/data/menuItems";

const item: MenuItem = {
  id: "sh-klassicheskaya",
  category: "shaverma",
  name: "Шаверма классическая",
  description: "Кура в маринаде",
  weight: "400 г",
  price: 320,
  image: "/images/menu/shaverma-kuritsa.jpg",
};

describe("ProductCard", () => {
  it("shows the name, weight and formatted price", () => {
    render(<ProductCard item={item} quantity={0} onAdd={() => {}} onRemove={() => {}} />);

    expect(screen.getByText("Шаверма классическая")).toBeInTheDocument();
    expect(screen.getByText("400 г")).toBeInTheDocument();
    expect(screen.getByText("320 ₽")).toBeInTheDocument();
  });

  it("shows a single + button when quantity is 0, and calls onAdd", () => {
    const onAdd = vi.fn();
    render(<ProductCard item={item} quantity={0} onAdd={onAdd} onRemove={() => {}} />);

    fireEvent.click(screen.getByLabelText("Добавить «Шаверма классическая» в корзину"));
    expect(onAdd).toHaveBeenCalledWith(item);
    expect(
      screen.queryByLabelText("Уменьшить количество «Шаверма классическая»")
    ).not.toBeInTheDocument();
  });

  it("shows a +/- stepper with the quantity once it's in the cart", () => {
    const onAdd = vi.fn();
    const onRemove = vi.fn();
    render(<ProductCard item={item} quantity={2} onAdd={onAdd} onRemove={onRemove} />);

    expect(screen.getByText("2")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Увеличить количество «Шаверма классическая»"));
    expect(onAdd).toHaveBeenCalledWith(item);

    fireEvent.click(screen.getByLabelText("Уменьшить количество «Шаверма классическая»"));
    expect(onRemove).toHaveBeenCalledWith(item);
  });

  it("shows 'Нет в наличии' and no add controls when stopped", () => {
    const onAdd = vi.fn();
    render(<ProductCard item={item} quantity={0} onAdd={onAdd} onRemove={() => {}} stopped />);

    expect(screen.getByText("Нет в наличии")).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Добавить «Шаверма классическая» в корзину")
    ).not.toBeInTheDocument();
  });

  it("hides the stepper even if already in the cart when stopped later", () => {
    render(<ProductCard item={item} quantity={2} onAdd={() => {}} onRemove={() => {}} stopped />);

    expect(screen.getByText("Нет в наличии")).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Увеличить количество «Шаверма классическая»")
    ).not.toBeInTheDocument();
  });

  it("doesn't show an expand arrow or the description", () => {
    render(<ProductCard item={item} quantity={0} onAdd={() => {}} onRemove={() => {}} />);

    expect(screen.queryByLabelText("Показать состав")).not.toBeInTheDocument();
    expect(screen.queryByText("Кура в маринаде")).not.toBeInTheDocument();
  });
});
