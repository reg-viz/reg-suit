import { Observable } from "rxjs";
import { Action } from "../actions";

export function logout(action$: Observable<Action>) {
  action$.filter(a => a.type === "logout").subscribe(() => {
    localStorage.removeItem("appToken");
    location.href = "https://reg-viz.github.io/reg-suit/";
  });
  return action$;
}
