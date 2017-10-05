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

// FIXME: This test failed on circleCI, because `reg-suit` repository is applied when there is no commit
//        But this test passed in my local env(git 2.14.1)....
//        This issue will be fixed in version using git-tiny-walker
// test.serial("no commit", t => {
//   copyGitFiles("no-commit");
//   t.throws(() => new CommitExplorer().getCurrentCommitHash());
// });


test.serial("detached head", t => {
  copyGitFiles("detached-head");
  t.throws(() => new CommitExplorer().getCurrentBranchName());
});

/*
* first commit
*/
test.serial("initial commit", t => {
  copyGitFiles("initial-commit");
  const baseHash = new CommitExplorer().getBaseCommitHash();
  t.is(null, baseHash);
});

/*
* (HEAD -> master) two commit
* first commit
*/
test.serial("master two commits", t => {
  copyGitFiles("master-two-commits");
  const baseHash = new CommitExplorer().getBaseCommitHash();
  t.is(null, baseHash);
});


/*
* (HEAD -> feat-y, master) second commit
* first commit
*/
test.serial("after create new branch", t => {
  copyGitFiles("after-create-new-branch");
  const baseHash = new CommitExplorer().getBaseCommitHash();
  t.is(null, baseHash);
});

/*
* (HEAD -> feat-y) y1
* (tag: expected, master) second commit
* first commit
*/
test.serial("commit after create new branch", t => {
  copyGitFiles("commit-new-branch");
  const baseHash = new CommitExplorer().getBaseCommitHash();
  const expected = execSync("git rev-parse expected", { encoding: "utf8" }).trim();
  t.is(expected, baseHash);
});

/*
* (HEAD -> feat-y) y2
* y1
* (tag: expected, master) second commit
* first commit
*/
test.serial("two commits after create new branch", t => {
  copyGitFiles("two-commit-new-branch");
  const baseHash = new CommitExplorer().getBaseCommitHash();
  const expected = execSync("git rev-parse expected", { encoding: "utf8" }).trim();
  t.is(expected, baseHash);
});

/*
*   (HEAD -> feat-x) merge master to feat-x
|\
| * (tag: expected, master) master1
* | x2
* | x1
|/
* second commit
* first commit
*/
test.serial("after catch up master merge", t => {
  copyGitFiles("after-catch-up-master");
  const baseHash = new CommitExplorer().getBaseCommitHash();
  const expected = execSync("git rev-parse expected", { encoding: "utf8" }).trim();
  t.is(expected, baseHash);
});

/*
* (HEAD -> feat-x) x3
*   merge master to feat-x
|\
| * (tag: expected, master) master1
| * x2
| * x1
|/
* second commit
* first commit
*/
test.serial("commit after merge", t => {
  copyGitFiles("commit-after-merge");
  const baseHash = new CommitExplorer().getBaseCommitHash();
  const expected = execSync("git rev-parse expected", { encoding: "utf8" }).trim();
  t.is(expected, baseHash);
});

/*
*   (HEAD -> master2x) merge master to master2x
|\
| * (master) master2
| * master1
* | (tag: expected, feat-x) x2
* | x1
|/
* first commit
*/

test.serial("master to catch up branch", t => {
  copyGitFiles("master-to-catch-up-branch");
  const baseHash = new CommitExplorer().getBaseCommitHash();
  const expected = execSync("git rev-parse expected", { encoding: "utf8" }).trim();
  t.is(expected, baseHash);
});

/*
*
* (HEAD -> feat-x) x3
*   merge master to feat-x
|\
| * (master) master2
* |   merge feat-y to feat-x
|\ \
| * \   (tag: expected, feat-y) merge master to feat-y
| |\ \
| | |/
| | * master1
* | | x2
|/ /
* | x1
|/
* first commit
*/

test.serial("commit after catch up and merge", t => {
  copyGitFiles("commit-after-catch-up-and-merge");
  const baseHash = new CommitExplorer().getBaseCommitHash();
  const expected = execSync("git rev-parse expected", { encoding: "utf8" }).trim();
  t.is(expected, baseHash);
});

// *   (HEAD -> feat-x) merge master2feat-x to feat-x
// |\
// | *   (master2feat-x) merge master to master2feat-x
// | |\
// |/ /
// | * (master) master1
// * | x2
// * | x1
// |/
// * (tag: expected) second commit
// * first commit
test.serial("after merge catch up", t => {
  copyGitFiles("after-merge-catch-up");
  const baseHash = new CommitExplorer().getBaseCommitHash();
  const expected = execSync("git rev-parse expected", { encoding: "utf8" }).trim();
  t.is(expected, baseHash);
});

// * (HEAD -> feat-x) x3
// *   merge master2feat-x to feat-x
// |\
// | *   (master2feat-x) merge master to master2feat-x
// | |\
// |/ /
// | * (tag: expected) (master) master2
// | * master1
// * | x2
// * | x1
// |/
// * second commit
// * first commit
test.serial("merge catch up and commit", t => {
  copyGitFiles("merge-catch-up-then-commit");
  const baseHash = new CommitExplorer().getBaseCommitHash();
  const expected = execSync("git rev-parse expected", { encoding: "utf8" }).trim();
  t.is(expected, baseHash);
});

