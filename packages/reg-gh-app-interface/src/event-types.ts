export interface BaseEventBody {
  installationId: string;
  owner: string;
  repository: string;
}

export interface CommentToPrBody extends BaseEventBody {
  branchName: string;
  failedItemsCount: number;
  newItemsCount: number;
  deletedItemsCount: number;
  passedItemsCount: number;
  reportUrl?: string;
}

export interface UpdateStatusBody extends BaseEventBody {
  installationId: string;
  sha1: string;
  description: string;
  state: "success" | "failure";
  reportUrl?: string;
}
