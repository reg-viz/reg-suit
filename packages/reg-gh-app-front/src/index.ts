import "whatwg-fetch";
import { render } from "react-dom";
import { createElement } from "react";
import { AppContainer } from "./components/app";
import { store } from "./store";
import { actionCreator } from "./action-creator";
import { registerSideEffects } from "./side-effects";

store.setActions$(registerSideEffects(actionCreator.actions$));
render(createElement(AppContainer), document.getElementById("app"));
