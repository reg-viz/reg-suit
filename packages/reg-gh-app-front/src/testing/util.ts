import * as React from "react";
import { render as renderToDom } from "react-dom";
const { screenshot } = require("avaron");

export function capture(name: string, after = 100) {
  return new Promise<undefined>(resolve => {
    setTimeout(() => resolve(), after);
  }).then(() => screenshot(name))
  ;
}

export function render(element: JSX.Element) {
  renderToDom(element, document.getElementById("app"));
}
