import { auth } from "./auth";
import { UpdateStatusContextQuery } from "./gql/_generated";
import * as updateStatusContextQuery from "./gql/update-status-context.graphql";
import { GhApiClient } from "./gh-api-client";

export class ValidateError extends Error {
  statusCode = 500;
}

export interface UpdateStatusBody {
  installationId: string;
  sha1: string;
  reportUrl?: string;
  changedFilesCount?: number;
  state: "success" | "fail" | "pending";
}

export interface UpdateStatusParams {
  state: "success" | "fail" | "pending";
  target_url?: string;
  description: string;
  context: string;
}

export function convert(result: UpdateStatusContextQuery, eventBody: UpdateStatusBody) {
  const repos = result.viewer.repositories.nodes;
  if (!repos || !repos.length || repos.length !== 1) {
    throw new ValidateError();
  }
  const repo = repos[0];
  const path = `/repos/${repo.owner.login}/${repo.name}/statuses/${eventBody.sha1}`;
  const description = ":tada:";
  const context = "reg";
  return {
    path,
    body: {
      state: eventBody.state,
      target_url: eventBody.reportUrl,
      description,
      context,
    },
  };
}

export async function updateStatus(eventBody: UpdateStatusBody) {
  const token = await auth(eventBody.installationId);
  const client = new GhApiClient(token);
  const context = await client.requestWithGraphQL(updateStatusContextQuery) as { data: UpdateStatusContextQuery };
  const { path, body } = convert(context.data, eventBody);
  return client.post(path, body);
}
