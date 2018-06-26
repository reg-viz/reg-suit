import { Observable } from "rxjs";
import { Subject } from "rxjs/Subject";
import { Installation, AppState, InstallationWithRepos, RepositoryWithInstallation } from "./types";
import { Action, InstallationResAction } from "./actions";
import { tokenize } from "./util/tokenize";

const initialState: AppState  = {
  searchText: "",
  isLoading: true,
  installations: [],
  repositories: [],
};

export class Store {
  _state$: Observable<AppState> | null = null;
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
          repositories: [
            ...currentState.repositories,
            ...action.payload.repositories.map(r => {
              const installation = currentState.installations.find(i => i.id === action.payload.installationId);
              return {
                ...r,
                installation,
                clientId: tokenize({
                  installationId: action.payload.installationId,
                  ownerName: r.owner.login,
                  repositoryName: r.name,
                  repositoryId: r.id,
                }),
              } as RepositoryWithInstallation;
            })
          ],
        };
      } else if (action.type === "changeSearchText") {
        return {
          ...currentState,
          searchText: action.payload.searchText,
        };
      } else if (action.type === "searchRepository") {
        const repositories = currentState.repositories.map(r => {
          const hidden = r.fullName.indexOf(action.payload.searchText) === -1;
          return { ...r, hidden };
        });
        return {
          ...currentState,
          repositories,
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
