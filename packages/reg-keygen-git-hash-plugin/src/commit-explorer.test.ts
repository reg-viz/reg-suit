import test from "ava";
import { execSync } from "child_process";
import { CommitExplorer } from "./commit-explorer";
import * as process from "process";
import * as path from "path";

const glob = require("glob");
const rimraf = require("rimraf");

process.chdir("./test");

test.afterEach.always(() => {
  rimraf.sync(path.resolve(__dirname, "../test/.git"));
});

const copyGitFiles = (name: string) => {
  execSync(`cp -r ${path.resolve("fixtures", name)} ${path.resolve("./", ".git")}`);
};

test.serial("detached head", t => {
  copyGitFiles("detached-head");
  t.throws(() => new CommitExplorer().getCurrentBranchName());
});

// FIXME: This test failed on circleCI, because `reg-suit` repository is applied when there is no commit
//        But this test passed in my local env(git 2.14.1)....
//        This issue will be fixed in version using git-tiny-walker
// test.serial("no commit", t => {
//   copyGitFiles("no-commit");
//   t.throws(() => new CommitExplorer().getCurrentCommitHash());
// });

test.serial("initial commit", t => {
  copyGitFiles("initial-commit");
  const baseHash = new CommitExplorer().getBaseCommitHash();
  t.is(null, baseHash);
});

test.serial("master two commits", t => {
  copyGitFiles("master-two-commits");
  const baseHash = new CommitExplorer().getBaseCommitHash();
  t.is(null, baseHash);
});

test.serial("after create new branch", t => {
  copyGitFiles("after-create-new-branch");
  const baseHash = new CommitExplorer().getBaseCommitHash();
  t.is(null, baseHash);
});

test.serial("commit after create new branch", t => {
  copyGitFiles("commit-new-branch");
  const baseHash = new CommitExplorer().getBaseCommitHash();
  const expected = execSync("git rev-parse expected", { encoding: "utf8" }).trim();
  t.is(expected, baseHash);
});

test.serial("two commits after create new branch", t => {
  copyGitFiles("two-commit-new-branch");
  const baseHash = new CommitExplorer().getBaseCommitHash();
  const expected = execSync("git rev-parse expected", { encoding: "utf8" }).trim();
  t.is(expected, baseHash);
});

test.serial("after catch up master merge", t => {
  copyGitFiles("after-catch-up-master");
  const baseHash = new CommitExplorer().getBaseCommitHash();
  const expected = execSync("git rev-parse expected", { encoding: "utf8" }).trim();
  t.is(expected, baseHash);
});


test.serial("commit after merge", t => {
  copyGitFiles("commit-after-merge");
  const baseHash = new CommitExplorer().getBaseCommitHash();
  const expected = execSync("git rev-parse expected", { encoding: "utf8" }).trim();
  t.is(expected, baseHash);
});

test.serial("commit after catch up and merge", t => {
  copyGitFiles("commit-after-catch-up-and-merge");
  const baseHash = new CommitExplorer().getBaseCommitHash();
  const expected = execSync("git rev-parse expected", { encoding: "utf8" }).trim();
  t.is(expected, baseHash);
});

test.serial("master to catch up branch", t => {
  copyGitFiles("master-to-catch-up-branch");
  const baseHash = new CommitExplorer().getBaseCommitHash();
  const expected = execSync("git rev-parse expected", { encoding: "utf8" }).trim();
  t.is(expected, baseHash);
});

