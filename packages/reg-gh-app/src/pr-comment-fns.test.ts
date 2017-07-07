import test from "ava";
import { convert, CommentToPrEventBody } from "./pr-comment-fns";

const eventBody: CommentToPrEventBody = {
  installationId: "100",
  owner: "someone",
  repository: "some-repo",
  branchName: "feat-x",
  deletedItemsCount: 0,
  failedItemsCount: 0,
  newItemsCount: 0,
  passedItemsCount: 0,
  reportUrl: "https://hoge.com/index.html",
};

test("convert from data01", t => {
  const log = require("../test/gql-log/update-pr-comment-context/data01.json");
  const actual = convert(log.data, eventBody);
  if (!Array.isArray(actual)) return t.fail();
  t.is(actual[0].method, "POST");
});

test("convert from data02", t => {
  const log = require("../test/gql-log/update-pr-comment-context/data02.json");
  const actual = convert(log.data, eventBody);
  if (!Array.isArray(actual)) return t.fail();
  t.is(actual[0].method, "PATCH");
});
