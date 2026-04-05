import React from "react";
import ReactDOM from "react-dom/client";
import singleSpaReact from "single-spa-react";
import App from "./App";
import "./app.css";

const lifecycles = singleSpaReact({
  React,
  ReactDOMClient: ReactDOM,
  rootComponent: App,
  domElementGetter: (props) => props.domElementGetter(),
  errorBoundary() {
    return <div>My List failed to load.</div>;
  },
});

export const bootstrap = lifecycles.bootstrap;

export function mount(props) {
  console.log("[my-list-mf] mount");
  return lifecycles.mount(props);
}

export function unmount(props) {
  console.log("[my-list-mf] unmount");
  return lifecycles.unmount(props);
}
