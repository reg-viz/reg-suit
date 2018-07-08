import test from "ava";
import * as sinon from "sinon";
import { ComparisonResult } from "reg-suit-interface";
import { RegLogger } from "reg-suit-util";
import { GitLabFixtureClient } from "./testing/gitlab-fixture-client";
import { commentToMergeRequests } from "./use-cases";

function createComparisonResult() {
  return { 
    actualDir: "",
    diffDir: "",
    expectedDir: "",
    actualItems: [],
    deletedItems: [],
    diffItems: [],
    failedItems: [],
    expectedItems: [],
    newItems: [],
    passedItems: [],
  } as ComparisonResult;
}

test("nothing post when noEmit: true", async t => {
  const client = new GitLabFixtureClient("base-no-marked-comment");
  const logger = new RegLogger();
  const getMergeRequestsSpy = sinon.spy(client, "getMergeRequests");
  const postMergeRequestNoteSpy = sinon.spy(client, "postMergeRequestNote");
  const putMergeRequestNoteSpy = sinon.spy(client, "putMergeRequestNote");
  await commentToMergeRequests({
    noEmit: true,
    client, logger,
    projectId: "1234",
    notifyParams: {
      actualKey: "cbab9a085be8cbcbdbd498d5226479ee5a44c34b",
      expectedKey: "EXPECTED",
      comparisonResult: createComparisonResult(),
    },
  });
  t.truthy(getMergeRequestsSpy.called);
  t.falsy(postMergeRequestNoteSpy.called);
  t.falsy(putMergeRequestNoteSpy.called);
});

test("add comment to MR when the MR does not have this notifiers comment", async t => {
  const client = new GitLabFixtureClient("base-no-marked-comment");
  const logger = new RegLogger();
  const getMergeRequestsSpy = sinon.spy(client, "getMergeRequests");
  const getMergeRequestCommitsSpy = sinon.spy(client, "getMergeRequestCommits");
  const postMergeRequestNoteSpy = sinon.spy(client, "postMergeRequestNote");
  const putMergeRequestNoteSpy = sinon.spy(client, "putMergeRequestNote");
  await commentToMergeRequests({
    noEmit: false,
    client, logger,
    projectId: "1234",
    notifyParams: {
      actualKey: "cbab9a085be8cbcbdbd498d5226479ee5a44c34b",
      expectedKey: "EXPECTED",
      comparisonResult: createComparisonResult(),
    },
  });
  t.truthy(getMergeRequestsSpy.called);
  t.deepEqual(getMergeRequestCommitsSpy.firstCall.args[0], { project_id: 1234, merge_request_iid: 1 });
  t.truthy(postMergeRequestNoteSpy.called);
  t.falsy(putMergeRequestNoteSpy.called);
});

test("add comment to MR when the MR already has note this notifiers comment", async t => {
  const client = new GitLabFixtureClient("base-fulfilled");
  const logger = new RegLogger();
  const getMergeRequestsSpy = sinon.spy(client, "getMergeRequests");
  const getMergeRequestCommitsSpy = sinon.spy(client, "getMergeRequestCommits");
  const postMergeRequestNoteSpy = sinon.spy(client, "postMergeRequestNote");
  const putMergeRequestNoteSpy = sinon.spy(client, "putMergeRequestNote");
  await commentToMergeRequests({
    noEmit: false,
    client, logger,
    projectId: "1234",
    notifyParams: {
      actualKey: "cbab9a085be8cbcbdbd498d5226479ee5a44c34b",
      expectedKey: "EXPECTED",
      comparisonResult: createComparisonResult(),
    },
  });
  t.truthy(getMergeRequestsSpy.called);
  t.deepEqual(getMergeRequestCommitsSpy.firstCall.args[0], { project_id: 1234, merge_request_iid: 1 });
  t.falsy(postMergeRequestNoteSpy.called);
  t.truthy(putMergeRequestNoteSpy.called);
});
