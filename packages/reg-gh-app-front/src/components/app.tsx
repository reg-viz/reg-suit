import * as React from "react";
import { Message, Segment, Dimmer, Loader } from "semantic-ui-react";
import { SearchForm } from "./search-form";
import { store } from "../store";
import { AppState } from "../types";
import { heading2 } from "./app.css";
import { RepositoryList } from "./repository-list";
import { GotoInstall } from "./goto-install";
import { Logout } from "./logout";

export type AppProps = AppState;

function renderContents({ isLoading, installations, searchText, repositories }: AppProps) {
  if (isLoading) return null;
  if (installations.length) {
    return (
      <div>
        <h2 className={heading2}>Repositories integrated with reg-suit GitHub app</h2>
        <SearchForm searchText={searchText} style={{ marginTop: 30 }} />
        <RepositoryList className="repo-list" repositories={repositories} style={{ marginTop: 30 }} />
      </div>
    );
  } else {
    return (
      <GotoInstall />
    );
  }
}

export function AppComponent(props: AppProps) {
  const { isLoading } = props;
    return (
      <div>
        <Dimmer active={isLoading}>
          <Loader />
        </Dimmer>
        {renderContents(props)}
        <Logout />
      </div>
    );
}

export class AppContainer extends React.Component<{}, AppState> {

  componentDidMount() {
    if (!store.state$) return;
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
