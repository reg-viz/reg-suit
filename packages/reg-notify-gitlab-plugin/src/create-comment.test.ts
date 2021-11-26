import assert from "assert";
import { createCommentBody } from "./create-comment";

const mockReportUrl = "https://reports-bucket-url/report.html";

test("Reports nothing has changed", async () => {
  const commentBody = createCommentBody({
    passedItemsCount: 42,
    failedItemsCount: 0,
    newItemsCount: 0,
    deletedItemsCount: 0,
  });

  assert.match(commentBody, /there is no visual difference/);
  assert.doesNotMatch(commentBody, /reports-bucket-url/);
});

test("Reports nothing has changed with report URL", async () => {
  const commentBody = createCommentBody({
    reportUrl: mockReportUrl,
    passedItemsCount: 42,
    failedItemsCount: 0,
    newItemsCount: 0,
    deletedItemsCount: 0,
  });

  assert.match(commentBody, /there is no visual difference/);
  assert.match(commentBody, /reports-bucket-url/);
});

test("Reports changes", async () => {
  const commentBody = createCommentBody({
    passedItemsCount: 0,
    failedItemsCount: 42,
    newItemsCount: 0,
    deletedItemsCount: 0,
  });

  assert.doesNotMatch(commentBody, /there is no visual difference/);
  assert.match(commentBody, /reg-suit detected visual differences/);
});

test("Reports changes with report URL", async () => {
  const commentBody = createCommentBody({
    reportUrl: mockReportUrl,
    passedItemsCount: 0,
    failedItemsCount: 42,
    newItemsCount: 0,
    deletedItemsCount: 0,
  });

  assert.match(commentBody, /reg-suit detected visual differences/);
  assert.match(commentBody, /reports-bucket-url/);
});

test("Reports changes with an icon per difference", async () => {
  const commentBody = createCommentBody({
    passedItemsCount: 4,
    failedItemsCount: 5,
    newItemsCount: 6,
    deletedItemsCount: 7,
  });

  // check for a 'does not match' for expected number plus one, to assert
  // that there are no more icons than expected
  assert.match(commentBody, new RegExp(":large_blue_circle: ".repeat(4)));
  assert.doesNotMatch(commentBody, new RegExp(":large_blue_circle: ".repeat(5)));
  assert.match(commentBody, new RegExp(":red_circle: ".repeat(5)));
  assert.doesNotMatch(commentBody, new RegExp(":red_circle: ".repeat(6)));
  assert.match(commentBody, new RegExp(":white_circle: ".repeat(6)));
  assert.doesNotMatch(commentBody, new RegExp(":white_circle: ".repeat(7)));
  assert.match(commentBody, new RegExp(":black_circle: ".repeat(7)));
  assert.doesNotMatch(commentBody, new RegExp(":black_circle: ".repeat(8)));
});

test("Reports changes with a short description", async () => {
  const commentBody = createCommentBody({
    passedItemsCount: 0,
    failedItemsCount: 50,
    newItemsCount: 60,
    deletedItemsCount: 70,
    shortDescription: true,
  });

  assert.match(commentBody, new RegExp(":red_circle:  Changed"));
  assert.match(commentBody, /50/);
  assert.match(commentBody, new RegExp(":white_circle:  New"));
  assert.match(commentBody, /60/);
  assert.match(commentBody, new RegExp(":black_circle:  Deleted"));
  assert.match(commentBody, /70/);
  assert.doesNotMatch(commentBody, new RegExp(":large_blue_circle:  Passingd"));
});
