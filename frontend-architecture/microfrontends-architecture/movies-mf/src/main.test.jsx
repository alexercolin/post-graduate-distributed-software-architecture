import { describe, expect, it, vi } from "vitest";

const lifecycleMount = vi.fn();
const lifecycleUnmount = vi.fn();
const singleSpaReact = vi.fn(() => ({
  bootstrap: vi.fn(),
  mount: lifecycleMount,
  unmount: lifecycleUnmount,
}));

vi.mock("single-spa-react", () => ({
  default: singleSpaReact,
}));

describe("movies main lifecycle", () => {
  it("delegates mount and unmount to single-spa-react with logging", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const { mount, unmount } = await import("./main");
    const props = { domElementGetter: () => document.createElement("div") };

    await mount(props);
    await unmount(props);

    expect(lifecycleMount).toHaveBeenCalledWith(props);
    expect(lifecycleUnmount).toHaveBeenCalledWith(props);
    expect(logSpy).toHaveBeenCalledWith("[movies-mf] mount");
    expect(logSpy).toHaveBeenCalledWith("[movies-mf] unmount");

    logSpy.mockRestore();
  });
});
