import * as React from "react";
import { InstallationWithRepos } from "../types";
import { RepositoryItem } from "./repository-item";

export interface InstallationItemProps {
  installation: InstallationWithRepos;
}

export class InstallationItem extends React.Component<InstallationItemProps> {

  renderRepos() {
    const { repositories, id } = this.props.installation;
    return repositories.filter(r=> !r.hidden).map(r => {
      return (
        <RepositoryItem key={r.id} installationId={id} repository={r} />
      );
    });
  }

  render() {
    const {
      id,
      account,
      type,
      loadingState,
    } = this.props.installation;
    if (loadingState === "loading") {
    return (
      <div>
        {account.login}
      </div>
    );
    } else if (loadingState === "done") {
    return (
      <div>
        {account.login}
        <div>{this.renderRepos()}</div>
      </div>
    );
    } else {
      return null;
    }
  }
}
