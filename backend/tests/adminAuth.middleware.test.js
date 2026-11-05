import { describe, it, expect, vi } from "vitest";
import { adminAuth } from "../src/middlewares/adminAuth.middleware.js";
import { config } from "../src/config/default.js";

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe("middlewares/adminAuth", () => {
  it("rejects a request with no Authorization header", () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = vi.fn();

    adminAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects a wrong password", () => {
    const req = { headers: { authorization: "Bearer definitely-wrong" } };
    const res = mockRes();
    const next = vi.fn();

    adminAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("accepts the configured password and calls next()", () => {
    const req = { headers: { authorization: `Bearer ${config.adminPassword}` } };
    const res = mockRes();
    const next = vi.fn();

    adminAuth(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });
});
