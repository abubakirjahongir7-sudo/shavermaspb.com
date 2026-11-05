import { describe, it, expect, beforeEach } from "vitest";
import { useCartStore } from "./cartStore";
import { menuItems } from "@/data/menuItems";

const shaverma = menuItems.find((i) => i.id === "sh-klassicheskaya")!;
const drink = menuItems.find((i) => i.id === "pitstsa-pepperoni")!;

describe("cartStore", () => {
  beforeEach(() => {
    useCartStore.setState({ items: {} });
  });

  it("starts empty", () => {
    expect(useCartStore.getState().items).toEqual({});
  });

  it("adds a new item with quantity 1", () => {
    useCartStore.getState().add(shaverma);
    expect(useCartStore.getState().items[shaverma.id]).toMatchObject({
      id: shaverma.id,
      name: shaverma.name,
      price: shaverma.price,
      quantity: 1,
    });
  });

  it("increments quantity when adding the same item again", () => {
    useCartStore.getState().add(shaverma);
    useCartStore.getState().add(shaverma);
    useCartStore.getState().add(shaverma);
    expect(useCartStore.getState().items[shaverma.id].quantity).toBe(3);
  });

  it("keeps separate quantities for different items", () => {
    useCartStore.getState().add(shaverma);
    useCartStore.getState().add(drink);
    useCartStore.getState().add(drink);

    expect(useCartStore.getState().items[shaverma.id].quantity).toBe(1);
    expect(useCartStore.getState().items[drink.id].quantity).toBe(2);
  });

  it("decrements quantity on remove", () => {
    useCartStore.getState().add(shaverma);
    useCartStore.getState().add(shaverma);
    useCartStore.getState().remove(shaverma);
    expect(useCartStore.getState().items[shaverma.id].quantity).toBe(1);
  });

  it("removes the item entirely once quantity reaches zero", () => {
    useCartStore.getState().add(shaverma);
    useCartStore.getState().remove(shaverma);
    expect(useCartStore.getState().items[shaverma.id]).toBeUndefined();
  });

  it("removing an item not in the cart is a no-op", () => {
    useCartStore.getState().remove(shaverma);
    expect(useCartStore.getState().items).toEqual({});
  });

  it("clear empties the whole cart", () => {
    useCartStore.getState().add(shaverma);
    useCartStore.getState().add(drink);
    useCartStore.getState().clear();
    expect(useCartStore.getState().items).toEqual({});
  });

  it("setComment attaches a comment to an item already in the cart", () => {
    useCartStore.getState().add(shaverma);
    useCartStore.getState().setComment(shaverma.id, "без лука");
    expect(useCartStore.getState().items[shaverma.id].comment).toBe("без лука");
  });

  it("setComment keeps whitespace as typed (trimming happens on submit, not per keystroke) and clears when set to blank", () => {
    useCartStore.getState().add(shaverma);
    useCartStore.getState().setComment(shaverma.id, "  без лука  ");
    expect(useCartStore.getState().items[shaverma.id].comment).toBe("  без лука  ");

    useCartStore.getState().setComment(shaverma.id, "   ");
    expect(useCartStore.getState().items[shaverma.id].comment).toBeUndefined();
  });

  it("setComment on an item not in the cart is a no-op", () => {
    useCartStore.getState().setComment(shaverma.id, "без лука");
    expect(useCartStore.getState().items).toEqual({});
  });

  it("keeps the comment when the quantity changes", () => {
    useCartStore.getState().add(shaverma);
    useCartStore.getState().setComment(shaverma.id, "без лука");
    useCartStore.getState().add(shaverma);
    expect(useCartStore.getState().items[shaverma.id]).toMatchObject({
      quantity: 2,
      comment: "без лука",
    });
  });
});
