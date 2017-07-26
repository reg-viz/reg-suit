import * as React from "react";
import { InstallationList } from "./installation-list";
import { store } from "../store";
import { AppState } from "../types";

export class AppContainer extends React.Component<{}, AppState> {

  componentDidMount() {
    store.state$.subscribe(state => {
      this.setState(state);
    });
  }

  render() {
    if (this.state) {
      const { installations } = this.state;
      return (
        <InstallationList installations={installations} />
      );
    } else {
      return null;
    }
  }
}
