import assert from "assert";
import sinon from "sinon";
import { ComparisonResult } from "reg-suit-interface";
import { RegLogger } from "reg-suit-util";
import { GitLabFixtureClient } from "./testing/gitlab-fixture-client";
import {
  commentToMergeRequests,
  appendOrUpdateMergerequestsBody,
  DESC_BODY_START_MARK,
  DESC_BODY_END_MARK,
  addDiscussionToMergeRequests,
} from "./use-cases";
import { PutMergeRequestParams } from "./gitlab-api-client";

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

test("nothing post when noEmit: true", async () => {
  const client = new GitLabFixtureClient("base-no-marked-comment");
  const logger = new RegLogger();
  const getMergeRequestsSpy = sinon.spy(client, "getMergeRequests");
  const postMergeRequestNoteSpy = sinon.spy(client, "postMergeRequestNote");
  const putMergeRequestNoteSpy = sinon.spy(client, "putMergeRequestNote");
  await commentToMergeRequests({
    noEmit: true,
    client,
    logger,
    projectId: "1234",
    notifyParams: {
      actualKey: "cbab9a085be8cbcbdbd498d5226479ee5a44c34b",
      expectedKey: "EXPECTED",
      comparisonResult: createComparisonResult(),
    },
  });
  assert.equal(getMergeRequestsSpy.called, true);
  assert.equal(postMergeRequestNoteSpy.called, false);
  assert.equal(putMergeRequestNoteSpy.called, false);
});

test("add comment to MR when the MR does not have this notifiers comment", async () => {
  const client = new GitLabFixtureClient("base-no-marked-comment");
  const logger = new RegLogger();
  const getMergeRequestsSpy = sinon.spy(client, "getMergeRequests");
  const getMergeRequestCommitsSpy = sinon.spy(client, "getMergeRequestCommits");
  const postMergeRequestNoteSpy = sinon.spy(client, "postMergeRequestNote");
  const putMergeRequestNoteSpy = sinon.spy(client, "putMergeRequestNote");
  await commentToMergeRequests({
    noEmit: false,
    client,
    logger,
    projectId: "1234",
    notifyParams: {
      actualKey: "cbab9a085be8cbcbdbd498d5226479ee5a44c34b",
      expectedKey: "EXPECTED",
      comparisonResult: createComparisonResult(),
    },
  });
  assert.equal(getMergeRequestsSpy.called, true);
  assert.deepStrictEqual(getMergeRequestCommitsSpy.firstCall.args[0], { project_id: 1234, merge_request_iid: 1 });
  assert.equal(postMergeRequestNoteSpy.called, true);
  assert.equal(putMergeRequestNoteSpy.called, false);
});

test("add comment to MR when the MR already has note this notifiers comment", async () => {
  const client = new GitLabFixtureClient("base-fulfilled");
  const logger = new RegLogger();
  const getMergeRequestsSpy = sinon.spy(client, "getMergeRequests");
  const getMergeRequestCommitsSpy = sinon.spy(client, "getMergeRequestCommits");
  const postMergeRequestNoteSpy = sinon.spy(client, "postMergeRequestNote");
  const putMergeRequestNoteSpy = sinon.spy(client, "putMergeRequestNote");
  await commentToMergeRequests({
    noEmit: false,
    client,
    logger,
    projectId: "1234",
    notifyParams: {
      actualKey: "cbab9a085be8cbcbdbd498d5226479ee5a44c34b",
      expectedKey: "EXPECTED",
      comparisonResult: createComparisonResult(),
    },
  });
  assert.equal(getMergeRequestsSpy.called, true);
  assert.deepStrictEqual(getMergeRequestCommitsSpy.firstCall.args[0], { project_id: 1234, merge_request_iid: 1 });
  assert.equal(postMergeRequestNoteSpy.called, false);
  assert.equal(putMergeRequestNoteSpy.called, true);
});

test("nothing discussion post when noEmit: true", async () => {
  const client = new GitLabFixtureClient("base-no-marked-comment");
  const logger = new RegLogger();
  const getMergeRequestsSpy = sinon.spy(client, "getMergeRequests");
  const postMergeRequestDiscussionSpy = sinon.spy(client, "postMergeRequestDiscussion");
  const putMergeRequestNoteSpy = sinon.spy(client, "putMergeRequestNote");
  await addDiscussionToMergeRequests({
    noEmit: true,
    client,
    logger,
    projectId: "1234",
    notifyParams: {
      actualKey: "cbab9a085be8cbcbdbd498d5226479ee5a44c34b",
      expectedKey: "EXPECTED",
      comparisonResult: createComparisonResult(),
    },
  });
  assert.equal(getMergeRequestsSpy.called, true);
  assert.equal(postMergeRequestDiscussionSpy.called, false);
  assert.equal(putMergeRequestNoteSpy.called, false);
});

test("add discussion comment to MR when the MR does not have this notifiers comment", async () => {
  const client = new GitLabFixtureClient("base-no-marked-comment");
  const logger = new RegLogger();
  const getMergeRequestsSpy = sinon.spy(client, "getMergeRequests");
  const getMergeRequestCommitsSpy = sinon.spy(client, "getMergeRequestCommits");
  const postMergeRequestDiscussionSpy = sinon.spy(client, "postMergeRequestDiscussion");
  const putMergeRequestNoteSpy = sinon.spy(client, "putMergeRequestNote");
  await addDiscussionToMergeRequests({
    noEmit: false,
    client,
    logger,
    projectId: "1234",
    notifyParams: {
      actualKey: "cbab9a085be8cbcbdbd498d5226479ee5a44c34b",
      expectedKey: "EXPECTED",
      comparisonResult: createComparisonResult(),
    },
  });
  assert.equal(getMergeRequestsSpy.called, true);
  assert.deepStrictEqual(getMergeRequestCommitsSpy.firstCall.args[0], { project_id: 1234, merge_request_iid: 1 });
  assert.equal(postMergeRequestDiscussionSpy.called, true);
  assert.equal(putMergeRequestNoteSpy.called, false);
});

test("update discussion to MR when the MR already has note this notifiers comment", async () => {
  const client = new GitLabFixtureClient("base-fulfilled");
  const logger = new RegLogger();
  const getMergeRequestsSpy = sinon.spy(client, "getMergeRequests");
  const getMergeRequestCommitsSpy = sinon.spy(client, "getMergeRequestCommits");
  const postMergeRequestDiscussionSpy = sinon.spy(client, "postMergeRequestDiscussion");
  const putMergeRequestNoteSpy = sinon.spy(client, "putMergeRequestNote");
  await addDiscussionToMergeRequests({
    noEmit: false,
    client,
    logger,
    projectId: "1234",
    notifyParams: {
      actualKey: "cbab9a085be8cbcbdbd498d5226479ee5a44c34b",
      expectedKey: "EXPECTED",
      comparisonResult: createComparisonResult(),
    },
  });
  assert.equal(getMergeRequestsSpy.called, true);
  assert.deepStrictEqual(getMergeRequestCommitsSpy.firstCall.args[0], { project_id: 1234, merge_request_iid: 1 });
  assert.equal(postMergeRequestDiscussionSpy.called, false);
  assert.equal(putMergeRequestNoteSpy.called, true);
});

test("modify description of MR", async () => {
  const client = new GitLabFixtureClient("base-fulfilled");
  const logger = new RegLogger();
  const getMergeRequestsSpy = sinon.spy(client, "getMergeRequests");
  const putMergeRequestSpy = sinon.spy(client, "putMergeRequest");
  await appendOrUpdateMergerequestsBody({
    noEmit: false,
    client,
    logger,
    projectId: "1234",
    notifyParams: {
      actualKey: "cbab9a085be8cbcbdbd498d5226479ee5a44c34b",
      expectedKey: "EXPECTED",
      comparisonResult: createComparisonResult(),
    },
  });
  assert.equal(getMergeRequestsSpy.called, true);
  assert.equal(putMergeRequestSpy.called, true);
  const { description } = putMergeRequestSpy.firstCall.args[0] as PutMergeRequestParams;
  if (!description) {
    throw new assert.AssertionError();
  }
  assert.equal(description.indexOf(DESC_BODY_START_MARK) !== -1, true);
  assert.equal(description.indexOf(DESC_BODY_END_MARK) !== -1, true);
});
