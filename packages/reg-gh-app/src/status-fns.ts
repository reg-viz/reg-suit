import { DataValidationError } from "./error";
import { UpdateStatusContextQuery } from "./gql/_generated";

export interface UpdateStatusBody {
  installationId: string;
  sha1: string;
  description: string;
  state: "success" | "failure";
  reportUrl?: string;
}

export function validateEventBody(input: Partial<UpdateStatusBody>) {
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
  target_url?: string;
  description: string;
  context: string;
}

export function convert(result: UpdateStatusContextQuery, eventBody: UpdateStatusBody) {
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

