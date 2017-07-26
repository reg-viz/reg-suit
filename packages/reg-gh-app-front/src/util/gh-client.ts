import { Installation, Repository } from "../types";
import { camelize } from "./camelize";

export class GitHubClient {

  _token() {
    return localStorage["appToken"];
  }

  fetchInstallations() {
    return fetch("https://api.github.com/user/installations", {
      headers: {
        "Accept": "application/vnd.github.machine-man-preview+json",
        "Authorization": `Bearer ${this._token()}`,
      }
    }).then(r => r.json())
      .then(obj => camelize(obj.installations) as Installation[])
    ;
  }

  fetchRepositories(installationId: number) {
    return fetch(`https://api.github.com/user/installations/${installationId}/repositories`, {
      headers: {
        "Accept": "application/vnd.github.machine-man-preview+json",
        "Authorization": `Bearer ${this._token()}`,
      }
    }).then(r => r.json())
      .then(obj => camelize(obj.repositories) as Repository[])
    ;
  }
}

export const ghClient = new GitHubClient();
