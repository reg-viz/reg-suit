import { User, Repository, InstallationWithRepos, Installation, RepositoryWithInstallation } from "../../types";
import { readAvatar } from "./read-avatar";

export const baseUser: User = {
  id: 10,
  avatarUrl: readAvatar("quramy"),
  login: "Quramy",
};

export const baseRepo: Repository = {
  id: 100,
  fullName: "quramy/reg-suit-sample",
  name: "reg-suit-sample",
  owner: baseUser,
};

export const baseInstallation: Installation = {
  id: 2000,
  account: baseUser,
  type: "User",
};

export const baseInstallationWithRepos: InstallationWithRepos = {
  ...baseInstallation,
  loadingState: "done",
  repositories: [],
  hidden: false,
};

export const baseRepoWithInstallation: RepositoryWithInstallation = {
  ...baseRepo,
  clientId: "123456abcdefghijk==",
  hidden: false,
  installation: baseInstallation,
};

export function createRepositoies(size = 10) {
  return new Array(size).fill(null).map((_, i) => {
    return {
      ...baseRepoWithInstallation,
      id: 100 + i,
      name: baseRepo.name + i,
    } as RepositoryWithInstallation;
  });
}
