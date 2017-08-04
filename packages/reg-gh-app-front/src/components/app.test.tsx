import test from "ava";
import * as React from "react";
import { render, capture } from "../testing/util";
import { AppComponent, AppProps } from "./app";
import {
  baseInstallationWithRepos,
  createRepositoies,
} from "../testing/data";

test.serial("render loading", async t => {
  const props: AppProps = {
    isLoading: true,
    installations: [],
    repositories: [],
    searchText: "",
  };
  render(<AppComponent {...props} />);
  t.truthy(!document.querySelector(".repo-list"));
});

test.serial("render without installations", async t => {
  const props: AppProps = {
    isLoading: false,
    installations: [],
    repositories: [],
    searchText: "",
  };
  render(<AppComponent {...props} />);
  await capture("screenshot/app_goto_install.png", 800);
  t.truthy(!document.querySelector(".repo-list"));
});

test.serial("render with installations", async t => {
  const props: AppProps = {
    isLoading: false,
    installations: [baseInstallationWithRepos],
    repositories: createRepositoies(3),
    searchText: "reg-su",
  };
  render(<AppComponent {...props} />);
  await capture("screenshot/app_installations.png", 800);
  t.truthy(document.querySelector(".repo-list"));
});
