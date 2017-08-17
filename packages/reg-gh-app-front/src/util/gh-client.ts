import { Installation, Repository } from "../types";
import { camelize } from "./camelize";
import { login } from "../login";

export class GitHubClient {

  constructor() {
    this._handleError = this._handleError.bind(this);
  }

  _token() {
    return localStorage["appToken"];
  }

  _createHeaders() {
    return  {
      "Accept": "application/vnd.github.machine-man-preview+json",
      "Authorization": `Bearer ${this._token()}`,
    };
  }

  _handleError(r: Response) {
    if (r.status >= 400) {
      login();
      return Promise.reject<Response>(r.statusText);
    }
    return r;
  }

  fetchInstallations() {
    return fetch(`https://api.github.com/user/installations?seq=${this._seq()}`, {
      headers: this._createHeaders(),
    }).then(this._handleError)
      .then(r => r.json())
      .then(obj => camelize(obj.installations) as Installation[])
    ;
  }

  fetchRepositories(installationId: number) {
    return fetch(`https://api.github.com/user/installations/${installationId}/repositories?seq=${this._seq()}`, {
      headers: this._createHeaders(),
    }).then(this._handleError)
      .then(r => r.json())
      .then(obj => camelize(obj.repositories) as Repository[])
    ;
  }

  private _seq() {
    return Date.now() % 10000;
  }
}

export const ghClient = new GitHubClient();
