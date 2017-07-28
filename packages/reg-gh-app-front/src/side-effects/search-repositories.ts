import { Observable } from "rxjs";
import { Action, ChangeSearchTextAction, SearchRepositoriesAction } from "../actions";

export function searchRepositories(actions$: Observable<Action>) {
  const search$ = actions$
    .filter(a => a.type === "changeSearchText")
    .debounceTime(100)
    .map((a: ChangeSearchTextAction) => ({
      type: "searchRepository",
      payload: a.payload
    } as SearchRepositoriesAction))
  ;
  return actions$.merge(search$);
}
