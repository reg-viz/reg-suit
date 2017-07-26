import { Installation, Repository } from "./types";

export type HogeAction = {
  type: "hoge";
  payload: { }
};

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

export interface InitAction {
  type: "init";
}

export type Action =
  InitAction |
  InstallationResAction |
  RepositoriesReqAction |
  RepositoriesResAction
;
