import { Observable } from "rxjs";
import { Installation } from "../types";
import { Action, InstallationResAction } from "../actions";
import { ghClient } from "../util/gh-client";

export function fetchInstallations(action$: Observable<Action>) {
  const fetchInstallations$ = action$
    .filter(a => a.type === "init")
    .switchMap(() => ghClient.fetchInstallations())
    .map(installations => {
      return {
        type: "installationsRes",
        payload: installations,
      } as InstallationResAction;
    })
  ;
  return action$.merge(fetchInstallations$);
}
