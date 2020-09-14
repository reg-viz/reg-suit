export interface CommentSeed {
  reportUrl?: string;
  failedItemsCount: number;
  newItemsCount: number;
  deletedItemsCount: number;
  passedItemsCount: number;
}

// NOTE: The following function is copied from /packages/reg-gh-app/src/pr-comment-fns.ts
export function createCommentBody(eventBody: CommentSeed) {
  const lines: string[] = [];
  if (eventBody.failedItemsCount === 0 && eventBody.newItemsCount === 0 && eventBody.deletedItemsCount === 0) {
    lines.push(`:sparkles: :sparkles: **That's perfect, there is no visual difference!** :sparkles: :sparkles:`);
    if (eventBody.reportUrl) {
      lines.push("");
      lines.push(`You can check the report out [here](${eventBody.reportUrl}).`);
    }
  } else {
    lines.push("**reg-suit detected visual differences.**");
    lines.push("");
    if (eventBody.reportUrl) {
      lines.push("");
      lines.push(`Check [this report](${eventBody.reportUrl}), and review them.`);
      lines.push("");
    }
    lines.push(new Array(eventBody.failedItemsCount + 1).join(":red_circle: "));
    lines.push(new Array(eventBody.newItemsCount + 1).join(":white_circle: "));
    lines.push(new Array(eventBody.deletedItemsCount + 1).join(":black_circle: "));
    lines.push(new Array(eventBody.passedItemsCount + 1).join(":large_blue_circle: "));
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
    // lines.push(`<details>
    //               <summary>How can I change the check status?</summary>
    //               If reviewers accepts this differences, the reg context status will be green automatically.
    //               <br />
    //            </details><br />`);
  }
  return lines.join("\n");
}
