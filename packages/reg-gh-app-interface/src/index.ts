export interface CommentToPrBody {
  installationId: string;
  branchName: string;
  failedItemsCount: number;
  newItemsCount: number;
  deletedItemsCount: number;
  passedItemsCount: number;
  reportUrl?: string;
}

export interface UpdateStatusBody {
  installationId: string;
  sha1: string;
  description: string;
  state: "success" | "failure";
  reportUrl?: string;
}
