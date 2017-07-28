import { Observable } from "rxjs";
import { Subject } from "rxjs/Subject";
import { Installation, AppState, InstallationWithRepos } from "./types";
import { Action, InstallationResAction } from "./actions";

const initialState: AppState  = {
  searchText: "",
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
          isLoading: false,
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
              loadingState: "loading",
            } as InstallationWithRepos;
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
            } as InstallationWithRepos;
          }),
        };
      } else if (action.type === "changeSearchText") {
        return {
          ...currentState,
          searchText: action.payload.searchText,
        };
      } else if (action.type === "searchRepository") {
        const installations = currentState.installations.map(installation => {
          const owner = installation.account.login;
          const repos = installation.repositories.map(r => {
            const hidden = r.fullName.indexOf(action.payload.searchText) === -1;
            return { ...r, hidden };
          });
          return {
            ...installation,
            repositories: repos,
            hidden: !repos.filter(r => !r.hidden).length,
          };
        });
        return {
          ...currentState,
          installations,
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
