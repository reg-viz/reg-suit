import { Installation, Repository } from "./types";

export interface InitAction {
  type: "init";
}

export type InstallationResAction = {
  type: "installationsRes";
  payload: Installation[];
};

export type RepositoriesReqAction = {
  type: "repositoriesReq";
  payload: {
    installationId: number;
  };
};

export type RepositoriesResAction = {
  type: "repositoriesRes";
  payload: {
    installationId: number;
    repositories: Repository[];
  };
};

export interface ChangeSearchTextAction {
  type: "changeSearchText";
  payload: {
    searchText: string;
  };
}

export interface SearchRepositoriesAction {
  type: "searchRepository";
  payload: {
    searchText: string;
  };
}

export type Action =
  InitAction |
  ChangeSearchTextAction |
  SearchRepositoriesAction |
  InstallationResAction |
  RepositoriesReqAction |
  RepositoriesResAction
;
