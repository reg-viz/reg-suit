import * as React from "react";
import { Repository } from "../types";

export interface RepositoryItemProps {
  installationId: number;
  repository: Repository;
}

export class RepositoryItem extends React.Component<RepositoryItemProps> {
  render() {
    const { name } = this.props.repository;
    return (
      <div>{this.props.installationId}/{this.props.repository.owner.login}/{name}</div>
    );
  }
}
