import * as React from "react";
import { SearchForm } from "./search-form";
import { InstallationList } from "./installation-list";
import { store } from "../store";
import { AppState } from "../types";

export type AppProps = AppState;

export function AppComponent(props: AppProps) {
  const { isLoading, installations, searchText } = props;
  if (isLoading) {
    return (
      <div>loading...</div>
    );
  }
  if (installations.length) {
    return (
      <div>
        <SearchForm searchText={searchText} />
        <InstallationList installations={installations} />
      </div>
    );
  } else {
    return (
      <div>
        Install <a href="https://github.com/apps/reg-suit">GitHub app</a>
      </div>
    );
  }
}

export class AppContainer extends React.Component<{}, AppState> {

  componentDidMount() {
    store.state$.subscribe(state => {
      this.setState(state);
    });
  }

  render() {
    if (this.state) {
      return <AppComponent {...this.state } />;
    } else {
      return null;
    }
  }
}
