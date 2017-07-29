import * as React from "react";
import { Icon } from "semantic-ui-react";
import { root, description } from "./goto-install.css";

export function GotoInstall() {
  return (
    <div className={root}>
      <Icon name="download" size="massive" />
      <p className={description}>
        Please install <a className="text-link" href="https://github.com/apps/reg-suit">reg-suit GitHub app</a>. <br />
        reg-suit app notifies results of regression tests to your repository.
      </p>
    </div>
  );
}
