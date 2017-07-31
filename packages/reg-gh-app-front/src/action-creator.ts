import { Observable } from "rxjs";
import { BehaviorSubject } from "rxjs";
import { Action, InitAction, ChangeSearchTextAction } from "./actions";

export class ActionCreator {

  /**
   * @private
   **/
  _actions$ = new BehaviorSubject<Action>({ type: "init" });

  init() {
    this._actions$.next({ type: "init" });
  }

  logout() {
    this._actions$.next({ type: "logout" });
  }

  changeSearchText(searchText: string) {
    this._actions$.next({
      type: "changeSearchText",
      payload: {
        searchText,
      },
    } as ChangeSearchTextAction);
  }

  get actions$(): Observable<Action>  {
    return this._actions$;
  }
}

export const actionCreator = new ActionCreator();
