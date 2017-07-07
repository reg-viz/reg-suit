import { UpdateStatusBody } from "reg-gh-app-interface";
import { NotInstallationError, DataValidationError } from "./error";
import { UpdateStatusContextQuery, StatusDetailQuery, StatusDetailQueryVariables } from "./gql/_generated";
import { PullRequestReviewPayload } from "./webhook-detect";

export type UpdateStatusEventBody = UpdateStatusBody;

export function validateEventBody(input: Partial<UpdateStatusEventBody>) {
  const result =
    typeof input.installationId === "string" &&
    typeof input.owner === "string" &&
    typeof input.repository === "string" &&
    typeof input.sha1 === "string" &&
    typeof input.description === "string" &&
    (input.state === "success" || input.state === "failure")
  ;
  if (!result) throw new DataValidationError(400, "invalid params");
  return true;
}

export interface UpdateStatusParams {
  state: "success" | "failure";
  target_url: string | null;
  description: string;
  context: string;
}

export function convert(result: UpdateStatusContextQuery, eventBody: UpdateStatusEventBody) {
  const repo = result.repository;
  if (!repo) {
    throw new NotInstallationError(eventBody.repository);
  }
  const path = `/repos/${repo.nameWithOwner}/statuses/${eventBody.sha1}`;
  const context = "reg";
  return {
    path,
    body: {
      state: eventBody.state,
      target_url: eventBody.reportUrl,
      description: eventBody.description,
      context,
    },
  };
}

export function createStatusDetailQueryVariables(payload: PullRequestReviewPayload): StatusDetailQueryVariables | null {
  if (payload.review.state !== "approved") return null;
  return {
    prNumber: payload.pull_request.number,
    owner: payload.repository.owner.login,
    repository: payload.repository.name,
  };
}

export function createSuccessStatusParams(detail: StatusDetailQuery, payload: PullRequestReviewPayload): { path: string, body: UpdateStatusParams } | null {
  const repo = detail.repository;
  if (!repo) throw new NotInstallationError(payload.repository.name);
  if (!repo.pullRequest) throw new DataValidationError(404, "PR not found");
  const commits = repo.pullRequest.commits.nodes;
  if (!commits) throw new DataValidationError(500, "No commits");
  const hit = commits.find(c => c.commit.oid === payload.review.commit_id);
  if (!hit || !hit.commit.status || !hit.commit.status.context) return null;
  return {
    path: `/repos/${payload.repository.full_name}/statuses/${hit.commit.oid}`,
    body: {
      state: "success",
      description: "Reviewer aprroved visual differences.",
      context: "reg",
      target_url: hit.commit.status.context.targetUrl,
    },
  };
}
