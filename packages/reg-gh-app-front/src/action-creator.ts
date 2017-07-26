import { Observable } from "rxjs";
import { BehaviorSubject } from "rxjs";
import { Action, InitAction } from "./actions";

export class ActionCreator {

  /**
   * @private
   **/
  _actions$ = new BehaviorSubject<Action>({ type: "init" });

  init() {
    this._actions$.next({ type: "init" });
  }

  get actions$(): Observable<Action>  {
    return this._actions$.asObservable();
  }
}

export const actionCreator = new ActionCreator();
