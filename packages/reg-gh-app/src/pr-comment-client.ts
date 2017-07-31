import { auth } from "./auth";
import { GhApiClient } from "./gh-api-client";
import { DataValidationError } from "./error";
import { UpdatePrCommentContextQuery, UpdatePrCommentContextQueryVariables, StatusDetailQuery } from "./gql/_generated";
import {
  CommentToPrEventBody,
  validateEventBody,
  convert,
  createCommentBody,
  createCommentParams
} from "./pr-comment-fns";
import * as updatePrCommentContextQuery from "./gql/update-pr-comment-context.graphql";
import * as statusDetailQuery from "./gql/status-detail.graphql";
import { PullRequestOpenPayload } from "./webhook-detect";
import { createStatusDetailQueryVariables } from "./status-fns";

export async function commentToPR(eventBody: CommentToPrEventBody) {
  validateEventBody(eventBody);
  const token = await auth(eventBody.installationId);
  const client = new GhApiClient(token);
  const variables: UpdatePrCommentContextQueryVariables = {
    owner: eventBody.owner,
    repository: eventBody.repository,
    branchName: eventBody.branchName,
  };
  const { data } = await client.requestWithGraphQL(updatePrCommentContextQuery, variables) as { data: UpdatePrCommentContextQuery };
  const converted = convert(data, eventBody);
  if (!Array.isArray(converted)) return converted;
  await Promise.all(converted.map(({ path, method, body }) => client.requestWithRestAPI(path, method, body)));
  return { message: "commented" };
}

export async function commentToPRFromWebhook(payload: PullRequestOpenPayload) {
  const token = await auth(payload.installation.id);
  const client = new GhApiClient(token);
  const variables = createStatusDetailQueryVariables(payload);
  if (!variables) return { message: "Nothing to do, but it's unreachable..." };
  const { data } = await client.requestWithGraphQL(statusDetailQuery, variables) as { data: StatusDetailQuery };
  const params = createCommentParams(data, payload);
  if (!params) return { message: "no comment" };
  await client.requestWithRestAPI(params.path, params.method, params.body);
  return { message: "commented" };
}
