import { NotInstallationError, DataValidationError } from "./error";
import { UpdatePrCommentContextQuery, UpdatePrCommentContextQueryVariables } from "./gql/_generated";
import { CommentToPrBody } from "reg-gh-app-interface";

export type CommentToPrEventBody  = CommentToPrBody;

export interface UpdateIssueCommentBody {
  body: string;
}
export interface UpdateIssueCommentApiParams {
  method: "POST" | "PATCH";
  path: string;
  body: UpdateIssueCommentBody;
}

export function validateEventBody(input: Partial<CommentToPrEventBody>) {
  const result =
    typeof input.installationId === "string" &&
    typeof input.owner === "string" &&
    typeof input.repository === "string" &&
    typeof input.branchName === "string" &&
    typeof input.failedItemsCount === "number" &&
    typeof input.newItemsCount === "number" &&
    typeof input.deletedItemsCount === "number" &&
    typeof input.passedItemsCount === "number"
  ;
  if (!result) throw new DataValidationError(400, "invalid params");
  return true;
}

export function createCommentBody(eventBody: CommentToPrEventBody) {
  const lines: string[] = [];
  if (eventBody.failedItemsCount === 0 && eventBody.newItemsCount === 0 && eventBody.deletedItemsCount === 0) {
    lines.push(`:sparkles::sparkles: **That's perfect, there is no visual difference!** :sparkles::sparkles:`);
    if (eventBody.reportUrl) {
      lines.push("");
      lines.push(`Report is [here](${eventBody.reportUrl}.)`);
    }
  } else {
    lines.push("**reg-suit detected visual differences.**");
    lines.push("");
    if (eventBody.reportUrl) {
      lines.push("");
      lines.push(`Check [this report](${eventBody.reportUrl}), and review them.`);
      lines.push("");
    }
    lines.push(new Array(eventBody.failedItemsCount + 1).join(":red_circle:"));
    lines.push(new Array(eventBody.newItemsCount + 1).join(":white_circle:"));
    lines.push(new Array(eventBody.deletedItemsCount + 1).join(":black_circle:"));
    lines.push(new Array(eventBody.passedItemsCount + 1).join(":large_blue_circle:"));
    lines.push("");
    lines.push(`<details>
                  <summary>What balls mean?</summary>
                  The number of balls represents the number of images change detected. <br />
                  :red_circle: : Changed items,
                  :white_circle: : New items,
                  :black_circle: : Deleted items, and
                  :large_blue_circle: Passed items
                  <br />
               </details><br />`);
    lines.push(`<details>
                  <summary>How can I change the check status?</summary>
                  If reviewers accepts this differences, the reg context status will be green automatically.
                  <br />
               </details><br />`);
  }
  return lines.join("\n");
}

export function convert(context: UpdatePrCommentContextQuery, eventBody: CommentToPrEventBody): UpdateIssueCommentApiParams[] | { message: string }{
  const repo = context.repository;
  if (!repo) {
    throw new NotInstallationError(eventBody.repository);
  }
  if (!repo.ref) {
    throw new DataValidationError(404, `Can't find ${eventBody.branchName} branch.`);
  }
  const prs = repo.ref.associatedPullRequests.nodes;
  if (!prs || !prs.length) return { message: `${eventBody.branchName} does not have open PRs.` };
  return prs.map(pr => {
    const paramsForCreate = {
      method: "POST",
      path: `/repos/${repo.nameWithOwner}/issues/${pr.number}/comments`,
      body: { body: createCommentBody(eventBody) },
    } as UpdateIssueCommentApiParams;
    if (!pr.comments.nodes || !pr.comments.nodes.length) {
      // create
      return paramsForCreate;
    } else {
      // find all comments reg-app created.
      const hits = pr.comments.nodes.filter(c => c.viewerDidAuthor);
      if (!hits.length) return paramsForCreate;
      const targetComment = hits.sort((c1, c2) => new Date(c2.createdAt).getTime() - new Date(c1.createdAt).getTime())[0];
      return {
        method: "PATCH",
        path: `/repos/${repo.nameWithOwner}/issues/comments/${targetComment.databaseId}`,
        body: { body: createCommentBody(eventBody) },
      } as UpdateIssueCommentApiParams;
    }
  });
}
