import { registerApplication, start } from "single-spa";

let configured = false;
let started = false;

export function setupRootConfig() {
  if (configured) {
    return;
  }

  const domElementGetter = () => document.getElementById("microfrontend-root");

  registerApplication({
    name: "@microfrontends/movies-mf",
    app: () => import("http://localhost:4101/src/main.jsx"),
    activeWhen: ["/movies"],
    customProps: { domElementGetter },
  });

  registerApplication({
    name: "@microfrontends/my-list-mf",
    app: () => import("http://localhost:4102/src/main.jsx"),
    activeWhen: ["/my-list"],
    customProps: { domElementGetter },
  });

  if (!started) {
    start();
    started = true;
  }

  configured = true;
}
