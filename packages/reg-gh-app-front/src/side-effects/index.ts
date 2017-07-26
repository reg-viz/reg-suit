import { Observable } from "rxjs";
import { Action } from "../actions";
import { fetchInstallations } from "./fetch-installations";
import { fetchRepositories } from "./fetch-repositories";

type SideEffect = (action$: Observable<Action>) => Observable<Action>;

const logging = (action$: Observable<Action>) => action$.do(a => console.log(a));

const effects = [
  fetchInstallations,
  fetchRepositories,
  logging,
];

export function registerSideEffects(action$: Observable<Action>) {
  return effects.reduce((acc, effect) => effect(acc), action$);
}
