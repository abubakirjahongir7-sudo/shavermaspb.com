import { describe, it, expect, vi } from "vitest";
import { addSseClient, removeSseClient, broadcastNewOrder, clientCount } from "../src/core/sseClients.js";

function fakeRes() {
  return { write: vi.fn() };
}

describe("core/sseClients", () => {
  it("broadcasts a new-order event to every connected client", () => {
    const a = fakeRes();
    const b = fakeRes();
    addSseClient(a);
    addSseClient(b);

    broadcastNewOrder({ id: 42 });

    expect(a.write).toHaveBeenCalledWith(expect.stringContaining("event: new-order"));
    expect(a.write).toHaveBeenCalledWith(expect.stringContaining('"orderId":42'));
    expect(b.write).toHaveBeenCalledTimes(1);

    removeSseClient(a);
    removeSseClient(b);
  });

  it("stops sending to a client after it's removed", () => {
    const a = fakeRes();
    addSseClient(a);
    removeSseClient(a);

    broadcastNewOrder({ id: 1 });

    expect(a.write).not.toHaveBeenCalled();
  });

  it("does nothing (and doesn't throw) with no clients connected", () => {
    expect(clientCount()).toBe(0);
    expect(() => broadcastNewOrder({ id: 7 })).not.toThrow();
  });

  it("removes a client whose write() throws (e.g. the connection dropped)", () => {
    const broken = { write: vi.fn(() => { throw new Error("socket closed"); }) };
    addSseClient(broken);

    expect(() => broadcastNewOrder({ id: 1 })).not.toThrow();
    expect(clientCount()).toBe(0);
  });
});
