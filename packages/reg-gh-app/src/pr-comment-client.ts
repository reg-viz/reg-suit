import { auth } from "./auth";
import { GhApiClient } from "./gh-api-client";
import { DataValidationError } from "./error";
import { UpdatePrCommentContextQuery, UpdatePrCommentContextQueryVariables } from "./gql/_generated";
import {
  CommentToPrEventBody,
  validateEventBody,
  convert,
  createCommentBody,
} from "./pr-comment-fns";
import * as updatePrCommentContextQuery from "./gql/update-pr-comment-context.graphql";

export async function commentToPR(eventBody: CommentToPrEventBody) {
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
