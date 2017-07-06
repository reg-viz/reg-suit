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
