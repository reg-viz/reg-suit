export interface BaseEventBody {
  installationId: string;
  owner: string;
  repository: string;
}

export interface ResultMetadata {
  failedItemsCount: number;
  newItemsCount: number;
  deletedItemsCount: number;
  passedItemsCount: number;
}

export interface CommentToPrBody extends BaseEventBody, ResultMetadata {
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
  metadata?: ResultMetadata;
  reportUrl?: string;
}
