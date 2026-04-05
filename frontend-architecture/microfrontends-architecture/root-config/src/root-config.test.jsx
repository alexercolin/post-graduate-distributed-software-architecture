import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const registerApplication = vi.fn();
const start = vi.fn();

vi.mock("single-spa", () => ({
  registerApplication,
  start,
}));

describe("setupRootConfig", () => {
  beforeEach(() => {
    vi.resetModules();
    registerApplication.mockClear();
    start.mockClear();
    document.body.innerHTML = '<div id="microfrontend-root"></div>';
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("registers both route-based microfrontends and starts single-spa", async () => {
    const { setupRootConfig } = await import("./root-config");

    setupRootConfig();

    expect(registerApplication).toHaveBeenCalledTimes(2);
    expect(registerApplication).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        name: "@microfrontends/movies-mf",
        activeWhen: ["/movies"],
      })
    );
    expect(registerApplication).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        name: "@microfrontends/my-list-mf",
        activeWhen: ["/my-list"],
      })
    );
    expect(start).toHaveBeenCalledTimes(1);

    const firstCall = registerApplication.mock.calls[0][0];
    expect(firstCall.customProps.domElementGetter()).toBe(
      document.getElementById("microfrontend-root")
    );
  });
});
