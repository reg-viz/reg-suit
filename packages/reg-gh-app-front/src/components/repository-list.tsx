import * as React from "react";
import { RepositoryWithInstallation } from "../types";
import { RepositoryItem } from "./repository-item";
import { header, owner, repoName } from "./repository-list.css";

export interface RepositoryListProps {
  repositories: RepositoryWithInstallation[];
  className?: string;
  style: { [key: string]: any };
}

function renderItems(repos: RepositoryWithInstallation[]) {
  return repos.filter(r => !r.hidden).map(r => <RepositoryItem key={r.id} repository={r} />);
}

export function RepositoryList(props: RepositoryListProps) {
  return (
    <div style={props.style} className={props.className || ""}>
      <header className={header}>
        <div className={owner}>Owner</div>
        <div className={repoName}>Repository</div>
      </header>
      <div>
        {renderItems(props.repositories)}
      </div>
    </div>
  );
}
