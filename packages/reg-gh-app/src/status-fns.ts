import { UpdateStatusBody } from "reg-gh-app-interface";
import { DataValidationError } from "./error";
import { UpdateStatusContextQuery, StatusDetailQuery, StatusDetailQueryVariables } from "./gql/_generated";
import { PullRequestReviewPayload } from "./webhook-detect";

export type UpdateStatusEventBody = UpdateStatusBody;

export function validateEventBody(input: Partial<UpdateStatusEventBody>) {
  const result =
    typeof input.installationId === "string" &&
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
  const repos = result.viewer.repositories.nodes;
  if (!repos || !repos.length || repos.length !== 1) {
    throw new DataValidationError(500, "Don't detect target repository");
  }
  const repo = repos[0];
  const path = `/repos/${repo.owner.login}/${repo.name}/statuses/${eventBody.sha1}`;
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
  };
}

export function createSuccessStatusParams(detail: StatusDetailQuery, payload: PullRequestReviewPayload): { path: string, body: UpdateStatusParams } | null {
  const repos = detail.viewer.repositories.nodes;
  if (!repos || !repos.length || repos.length !== 1) throw new DataValidationError(404, "Repository not found");
  const repo = repos[0];
  if (!repo.pullRequest) throw new DataValidationError(404, "PR not found");
  const commits = repo.pullRequest.commits.nodes;
  if (!commits) throw new DataValidationError(500, "No commits");
  const hit = commits.find(c => c.commit.oid === payload.review.commit_id);
  if (!hit || !hit.commit.status || !hit.commit.status.context) return null;
  return {
    path: `/repos/${payload.repository.full_name}/statuses/${hit.commit.oid}`,
    body: {
      state: "success",
      description: "The difference was approved with review.",
      context: "reg",
      target_url: hit.commit.status.context.targetUrl,
    },
  };
}
