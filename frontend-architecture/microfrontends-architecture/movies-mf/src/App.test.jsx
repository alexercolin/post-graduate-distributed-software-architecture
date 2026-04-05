import { render, screen } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  it("identifies the route owner and shell ownership", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Movies Microfrontend" })
    ).toBeInTheDocument();
    expect(screen.getByText(/Route owner:/)).toBeInTheDocument();
    expect(screen.getByText(/single-spa/i)).toBeInTheDocument();
  });
});
