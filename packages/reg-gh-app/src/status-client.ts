import { auth } from "./auth";
import { gqlRequest } from "./gql-client";
import { requestWithV3api } from "./gh-v3-client";

export interface UpdateStatusBody {
  installationId: string;
  owner: string;
  repo: string;
  sha1: string;
  reportUrl?: string;
  changedFilesCount?: number;
  state: "success" | "fail" | "pending";
}

export function updateStatus(body: UpdateStatusBody) {
  return auth(body.installationId).then(token => {
    const path = `/repos/${body.owner}/${body.repo}/statuses/${body.sha1}`;
    return requestWithV3api(path, token, {
      state: body.state,
      target_url: body.reportUrl,
      description: "ok",
      context: "reg",
    });
  });
}
