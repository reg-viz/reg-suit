import "whatwg-fetch";
import { render } from "react-dom";
import { createElement } from "react";
import { AppContainer } from "./components/app";
import { store } from "./store";
import { actionCreator } from "./action-creator";
import { registerSideEffects } from "./side-effects";
import { login } from "./login";

function checkToken() {
  const token = localStorage["appToken"];
  return !!token;
}

if (!checkToken()) {
  login();
} else {
  store.setActions$(registerSideEffects(actionCreator.actions$));
  document.addEventListener("DOMContentLoaded", () => {
    render(createElement(AppContainer), document.getElementById("app"));
  });
}
