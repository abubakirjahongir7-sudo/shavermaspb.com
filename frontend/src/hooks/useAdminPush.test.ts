import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import * as api from "@/lib/api";
import { useAdminPush } from "./useAdminPush";

const fakeSubscription = {
  toJSON: () => ({ endpoint: "https://push.example/abc", keys: { p256dh: "k", auth: "a" } }),
};

function installPushSupport({ permission = "default", existing = null as unknown } = {}) {
  const pushManager = {
    getSubscription: vi.fn(async () => existing),
    subscribe: vi.fn(async () => fakeSubscription),
  };
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: { ready: Promise.resolve({ pushManager }) },
  });
  vi.stubGlobal("PushManager", function PushManager() {});
  vi.stubGlobal(
    "Notification",
    Object.assign(function Notification() {}, {
      permission,
      requestPermission: vi.fn(async () => "granted"),
    })
  );
  return pushManager;
}

describe("useAdminPush", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete (navigator as unknown as Record<string, unknown>).serviceWorker;
  });

  it("subscribes this device to the given branch when enabled", async () => {
    const pushManager = installPushSupport();
    vi.spyOn(api, "fetchPushPublicKey").mockResolvedValue("AQAB");
    const subscribeSpy = vi.spyOn(api, "subscribeAdminPush").mockResolvedValue();

    const { result } = renderHook(() => useAdminPush("secret", "grazhdanskiy-39b"));
    await waitFor(() => expect(result.current.status).toBe("off"));

    await act(() => result.current.enable());

    expect(pushManager.subscribe).toHaveBeenCalledWith(
      expect.objectContaining({ userVisibleOnly: true })
    );
    expect(subscribeSpy).toHaveBeenCalledWith(
      "secret",
      fakeSubscription.toJSON(),
      "grazhdanskiy-39b"
    );
    expect(result.current.status).toBe("on");
  });

  it("re-registers an existing subscription on load so the branch binding stays current", async () => {
    installPushSupport({ permission: "granted", existing: fakeSubscription });
    const subscribeSpy = vi.spyOn(api, "subscribeAdminPush").mockResolvedValue();

    const { result } = renderHook(() => useAdminPush("secret", "pionerskaya-37"));

    await waitFor(() => expect(result.current.status).toBe("on"));
    expect(subscribeSpy).toHaveBeenCalledWith("secret", fakeSubscription.toJSON(), "pionerskaya-37");
  });

  it("reports 'denied' when notifications were blocked", async () => {
    installPushSupport({ permission: "denied" });
    const { result } = renderHook(() => useAdminPush("secret", "grazhdanskiy-39b"));
    await waitFor(() => expect(result.current.status).toBe("denied"));
  });

  it("asks iPhone users to install the PWA first when push isn't available in Safari", async () => {
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)"
    );
    const { result } = renderHook(() => useAdminPush("secret", "grazhdanskiy-39b"));
    await waitFor(() => expect(result.current.status).toBe("needs-install"));
  });
});
