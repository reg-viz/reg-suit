import "whatwg-fetch";
import { render } from "react-dom";
import { createElement } from "react";
import { AppContainer } from "./components/app";
import { store } from "./store";
import { actionCreator } from "./action-creator";
import { registerSideEffects } from "./side-effects";

function checkToken() {
  const token = localStorage["appToken"];
  return !!token;
}

if (!checkToken()) {
  const GH_APP_CLIENT_ID = process.env["GH_APP_CLIENT_ID"];
  location.replace(`https://github.com/login/oauth/authorize?client_id=${GH_APP_CLIENT_ID}`);
} else {
  store.setActions$(registerSideEffects(actionCreator.actions$));
  document.addEventListener("DOMContentLoaded", () => {
    render(createElement(AppContainer), document.getElementById("app"));
  });
}
