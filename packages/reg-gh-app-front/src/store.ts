import { Observable } from "rxjs";
import { Subject } from "rxjs/Subject";
import { Installation, AppState, InstallationWithRepos } from "./types";
import { Action, InstallationResAction } from "./actions";

const initialState = {
  isLoading: true,
  installations: [],
};

export class Store {
  _state$: Observable<AppState>;
  setActions$(actions$: Observable<Action>) {
    this._state$ = actions$.scan((currentState: AppState, action: Action) => {
      if (action.type === "installationsRes") {
        return {
          ...currentState,
          installations: action.payload.map(i => {
            return {
              ...i,
              repositories: [],
              loadingState: "none",
            } as InstallationWithRepos;
          })
        };
      } else if (action.type === "repositoriesReq") {
        return {
          ...currentState,
          installations: currentState.installations.map(i => {
            if (i.id !== action.payload.installationId) {
              return i;
            }
            return {
              ...i,
              loadingState: "loding",
            };
          }),
        };
      } else if (action.type === "repositoriesRes") {
        return {
          ...currentState,
          installations: currentState.installations.map(i => {
            const { installationId, repositories } = action.payload;
            if (i.id !== action.payload.installationId) {
              return i;
            }
            return {
              ...i,
              loadingState: "done",
              repositories,
            };
          }),
        };
      }
      return currentState;
    }, initialState as AppState);
  }

  get state$() {
    return this._state$;
  }
}

export const store = new Store();
