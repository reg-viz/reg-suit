import { Observable } from "rxjs";
import { Action, InstallationResAction, RepositoriesResAction, RepositoriesReqAction } from "../actions";
import { ghClient } from "../util/gh-client";

export function fetchRepositories(action$: Observable<Action>) {
  const installations$ = action$.filter(a => a.type === "installationsRes");
  const repoReq$ = installations$
    .flatMap((a: InstallationResAction) => Observable.from(a.payload.map(i => i.id)))
    .map(installationId => ({
      type: "repositoriesReq",
      payload: {
        installationId,
      },
    } as RepositoriesReqAction));
  const repo$ = installations$
    .flatMap((a :InstallationResAction) => Observable.from(a.payload.map(i => i.id)))
    .flatMap(id => ghClient.fetchRepositories(id).then(repositories => {
      return {
        type: "repositoriesRes",
        payload: {
          installationId: id,
          repositories,
        },
      } as RepositoriesResAction;
    }))
  ;
  return action$.merge(repoReq$).merge(repo$);
}
