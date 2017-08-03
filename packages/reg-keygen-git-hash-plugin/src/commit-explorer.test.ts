import test from "ava";
import { CommitExplorer } from "./commit-explorer";
import { GitLogLoader } from "./testing/git-log-loader";

function createFixture(name: string) {
  const loader = new GitLogLoader(name);
  const explorerFixture = new CommitExplorer();
  explorerFixture._gitCmdClient = loader;
  return explorerFixture;
}

test("detached head", t => {
  const fixture = createFixture("detached-head");
  t.throws(() => fixture.getCurrentBranchName());
});

test("no commit", t => {
  const fixture = createFixture("no-commit");
  t.throws(() => fixture.getCurrentCommitHash());
});

test("initial commit", t => {
  const fixture = createFixture("initial-commit");
  t.is(fixture.getCurrentCommitHash(), "78f91266532ec931a344af57f4d421abb15d931c");
  t.is(fixture.getBaseCommitHash(), null);
  t.pass();
});

test("2 commits master", t => {
  const fixture = createFixture("master-two-commits");
  t.is(fixture.getCurrentCommitHash(), "04b2059edc53f25bf740090b7cec1f0f1988f63c");
  t.is(fixture.getBaseCommitHash(), null);
});

test("after create new branch", t => {
  const fixture = createFixture("after-new-branch");
  t.is(fixture.getCurrentCommitHash(), "04b2059edc53f25bf740090b7cec1f0f1988f63c");
  t.is(fixture.getBaseCommitHash(), null);
});

test("1 commit after create new branch", t => {
  const fixture = createFixture("commit-new-branch");
  t.is(fixture.getBaseCommitHash(), "04b2059edc53f25bf740090b7cec1f0f1988f63c");
});

test("2 commits after create new branch", t => {
  const fixture = createFixture("two-commit-new-branch");
  t.is(fixture.getBaseCommitHash(), "04b2059edc53f25bf740090b7cec1f0f1988f63c");
});

test("after catch up master merge", t => {
  const fixture = createFixture("after-catch-up-master");
  t.not(fixture.getBaseCommitHash(), "04b2059edc53f25bf740090b7cec1f0f1988f63c");
  t.is(fixture.getBaseCommitHash(), "a2af7530f86d1f6a952be8c971f14b2b1f0ccb33");
});

test("commits after catch up master merge", t => {
  const fixture = createFixture("commit-after-merge");
  t.is(fixture.getBaseCommitHash(), "e8aadaf99ca505f4bb6d62bb930e215b5abd0295");
});

test("master to catch up branch", t => {
  const fixture = createFixture("master-to-catch-up-branch");
  t.is(fixture.getBaseCommitHash(), "4c2a76f08ec6122a29d74a04efddece1ff956863");
});
