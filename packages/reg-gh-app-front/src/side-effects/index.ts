import { Observable } from "rxjs";
import { Action } from "../actions";
import { logout } from "./logout";
import { fetchInstallations } from "./fetch-installations";
import { fetchRepositories } from "./fetch-repositories";
import { searchRepositories } from "./search-repositories";

type SideEffect = (action$: Observable<Action>) => Observable<Action>;

// TODO remove later
/* tslint:disable no-console */
const logging = (action$: Observable<Action>) => action$.do(a => console.log(a));

const effects = [
  fetchInstallations,
  fetchRepositories,
  searchRepositories,
  logout,
  logging,
];

export function registerSideEffects(action$: Observable<Action>) {
  return effects.reduce((acc, effect) => effect(acc).publish().refCount(), action$);
}
