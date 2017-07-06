import { auth } from "./auth";
import { GhApiClient } from "./gh-api-client";
import { UpdateStatusContextQuery } from "./gql/_generated";
import * as updateStatusContextQuery from "./gql/update-status-context.graphql";
import {
  UpdateStatusBody,
  convert,
  validateEventBody,
} from "./status-fns";

export async function updateStatus(eventBody: UpdateStatusBody) {
  validateEventBody(eventBody);
  const token = await auth(eventBody.installationId);
  const client = new GhApiClient(token);
  const context = await client.requestWithGraphQL(updateStatusContextQuery) as { data: UpdateStatusContextQuery };
  const { path, body } = convert(context.data, eventBody);
  return client.post(path, body);
}
