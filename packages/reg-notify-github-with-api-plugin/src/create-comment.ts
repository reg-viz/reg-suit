export interface CommentSeed {
  reportUrl?: string;
  failedItemsCount: number;
  newItemsCount: number;
  deletedItemsCount: number;
  passedItemsCount: number;
  shortDescription: boolean;
}

function tableItem(itemCount: number, header: string): [number, string] | null {
  return itemCount == 0 ? null : [itemCount, header];
}

/**
 * Returns a small table with the item counts.
 *
 * @example
 * | 🔴 Changed | ⚪️ New | 🔵 Passing |
 * | ---        | ---    | ---        |
 * | 3          | 4      | 120        |
 */
function shortDescription({
  failedItemsCount,
  newItemsCount,
  deletedItemsCount,
  passedItemsCount,
}: CommentSeed): string {
  const descriptions = [
    tableItem(failedItemsCount, ":red_circle:  Changed"),
    tableItem(newItemsCount, ":white_circle:  New"),
    tableItem(deletedItemsCount, ":black_circle:  Deleted"),
    tableItem(passedItemsCount, ":large_blue_circle:  Passing"),
  ];

  const filteredDescriptions = descriptions.filter((item): item is [number, string] => item != null);

  const headerColumns = filteredDescriptions.map(([_, header]) => header);
  const headerDelimiter = filteredDescriptions.map(() => " --- ");
  const itemCount = filteredDescriptions.map(([itemCount]) => itemCount);

  return `
    | ${headerColumns.join(" | ")} |
    | ${headerDelimiter.join(" | ")} |
    | ${itemCount.join(" | ")} |
  `;
}

function longDescription(eventBody: CommentSeed) {
  const lines = [];
  lines.push(new Array(eventBody.failedItemsCount + 1).join(":red_circle: "));
  lines.push(new Array(eventBody.newItemsCount + 1).join(":white_circle: "));
  lines.push(new Array(eventBody.deletedItemsCount + 1).join(":black_circle: "));
  lines.push(new Array(eventBody.passedItemsCount + 1).join(":large_blue_circle: "));
  lines.push("");
  lines.push(`<details>
                <summary>What do the circles mean?</summary>
                The number of circles represent the number of changed images. <br />
                :red_circle: : Changed items,
                :white_circle: : New items,
                :black_circle: : Deleted items, and
                :large_blue_circle: : Passing items
                <br />
             </details><br />`);
  return lines.join("\n");
}

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

    if (eventBody.shortDescription) {
      lines.push(shortDescription(eventBody));
    } else {
      lines.push(longDescription(eventBody));
    }

    lines.push(
      `<details>
          <summary>How can I change the check status?</summary>
          If reviewers approve this PR, the reg context status will be green automatically.
          <br />
       </details><br />`,
    );
  }
  return lines.join("\n");
}
