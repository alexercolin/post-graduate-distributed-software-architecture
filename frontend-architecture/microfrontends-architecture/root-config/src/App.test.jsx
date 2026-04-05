import { render, screen } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  it("renders shell navigation and mount container", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Microfrontends Architecture" })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Movies" })).toHaveAttribute(
      "href",
      "/movies"
    );
    expect(screen.getByRole("link", { name: "My List" })).toHaveAttribute(
      "href",
      "/my-list"
    );
    expect(document.getElementById("microfrontend-root")).not.toBeNull();
  });
});
