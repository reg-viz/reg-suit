/* tslint:disable:no-console */
export interface GitHubApiError {
  wellKnown: boolean;
  statusCode?: number;
  body?: {
    message?: string;
  };
}

export class DataValidationError extends Error implements GitHubApiError {
  wellKnown = true;
  body: {
    message: string;
  };
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.body = { message };
  }
}

const notInstallationMessage = (repositoryName: string) => `reg GitHub app is not installed into '${repositoryName}'. You can install this app https://github.com/apps/reg.`;

export class NotInstallationError extends Error implements GitHubApiError {
  wellKnown = true;
  statusCode: number;
  body: {
    message: string;
  };
  constructor(repositoryName: string) {
    super(notInstallationMessage(repositoryName));
    // const message = "";
    this.statusCode = 400;
    this.body = { message: notInstallationMessage(repositoryName) };
  }
}

export function isGhError(reason: any): reason is GitHubApiError {
  return reason["wellKnown"] === true;
}

export function convertError(reason: any) {
  if (reason instanceof Error) {
    console.error(reason);
    const err = {
      wellKnown: true,
    } as GitHubApiError;
    err.statusCode = (<any>reason).statusCode;
    err.body = { message: (<any>reason).error.message };
    return Promise.reject(err);
  } else {
    return Promise.reject(reason);
  }
}
