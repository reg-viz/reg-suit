import { auth } from "./auth";
import { GhApiClient } from "./gh-api-client";
import { UpdateStatusContextQuery, UpdateStatusContextQueryVariables, StatusDetailQuery } from "./gql/_generated";
import * as updateStatusContextQuery from "./gql/update-status-context.graphql";
import * as statusDetailQuery from "./gql/status-detail.graphql";
import { PullRequestReviewPayload } from "./webhook-detect";
import {
  UpdateStatusEventBody,
  convert,
  validateEventBody,
  createStatusDetailQueryVariables,
  createSuccessStatusParams,
} from "./status-fns";

export async function updateStatus(eventBody: UpdateStatusEventBody) {
  validateEventBody(eventBody);
  const token = await auth(eventBody.installationId);
  const client = new GhApiClient(token);
  const variables: UpdateStatusContextQueryVariables = {
    owner: eventBody.owner,
    repository: eventBody.repository,
  };
  const context = await client.requestWithGraphQL(updateStatusContextQuery, variables) as { data: UpdateStatusContextQuery };
  const { path, body } = convert(context.data, eventBody);
  return client.post(path, body);
}

export async function updateStatusFromWebhook(payload: PullRequestReviewPayload) {
  const token = await auth(payload.installation.id);
  const client = new GhApiClient(token);
  const variables = createStatusDetailQueryVariables(payload);
  if (!variables) return { message: "Nothing to do because it's not approved review submit." };
  const { data } = await client.requestWithGraphQL(statusDetailQuery, variables) as { data: StatusDetailQuery };
  const params = createSuccessStatusParams(data, payload);
  if (!params) return { message: "There is no commit status to change." };
  return client.post(params.path, params.body);
}
