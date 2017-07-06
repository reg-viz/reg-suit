/* tslint:disable:no-console */
export interface GithubApiError {
  wellKnown: true;
  statusCode?: number;
  body?: {
    message?: string;
  };
}

export function isGhError(reason: any): reason is GithubApiError {
  return reason["wellKnown"] === true;
}

export function convertError(reason: any) {
  if (reason instanceof Error) {
    const err = {
      wellKnown: true,
    } as GithubApiError;
    err.statusCode = (<any>reason).statusCode;
    err.body = { message: (<any>reason).error.message };
    return Promise.reject(err);
  } else {
    return Promise.reject(reason);
  }
}
