import * as React from "react";
import { Button } from "semantic-ui-react";
import { RepositoryWithInstallation } from "../types";
import { ClientIdModal } from "./client-id-modal";
import { RoundButton } from "./round-button";
import { avatar, root, main, loginName } from "./repository-item.css";

export interface RepositoryItemProps {
  repository: RepositoryWithInstallation;
}

export class RepositoryItem extends React.Component<RepositoryItemProps> {
  render() {
    const { name, owner, id, installation, clientId } = this.props.repository;
    return (
      <div className={root}>
        <img className={avatar} src={owner.avatarUrl} alt={owner.login} />
        <div className={loginName}>{owner.login}</div>
        <div className={main}>{name}</div>
        <ClientIdModal
          repositoryName={name}
          clientId={clientId}
          trigger={<RoundButton>Get client ID</RoundButton>}
        />
      </div>
    );
  }
}
