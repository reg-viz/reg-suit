export interface Installation {
  id: number;
  account: User;
  type: "Organization" | "User";
}

export interface User {
  id: number;
  login: string;
  avatarUrl: string;
}

export interface Repository {
  id: number;
  name: string;
  fullName: string;
  owner: User;
  hidden?: boolean;
}

export interface RepositoryWithInstallation extends Repository {
  installation: Installation;
  clientId: string;
}

export interface InstallationWithRepos extends Installation {
  loadingState: "none" | "loading" | "done" | "failure";
  repositories: Repository[];
  hidden?: boolean;
}

export interface AppState {
  searchText: string;
  isLoading: boolean;
  installations: InstallationWithRepos[];
  repositories: RepositoryWithInstallation[];
}
