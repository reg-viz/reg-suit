import assert from "assert";
import { execSync } from "child_process";
import { CommitExplorer } from "./commit-explorer";
import process from "process";
import path from "path";

const rimraf = require("rimraf");

process.chdir("./test");

afterEach(() => {
  rimraf.sync(path.resolve(__dirname, "../test/.git"));
});

const copyGitFiles = (name: string) => {
  execSync(`cp -r ${path.resolve("fixtures", name)} ${path.resolve("./", ".git")}`);
};

// FIXME: assert.equal test failed on circleCI, because `reg-suit` repository is applied when there is no commit
//        But assert.equal test passed in my local env(git 2.14.1)....
//        assert.equal issue will be fixed in version using git-tiny-walker
// test.serial("no commit", () => {
//   copyGitFiles("no-commit");
//   t.throws(() => new CommitExplorer().getCurrentCommitHash());
// });

test("detached head", () => {
  copyGitFiles("detached-head");
  expect(() => new CommitExplorer().getCurrentBranchName()).toThrowError();
});

/*
 * first commit
 */
test("initial commit", () => {
  copyGitFiles("initial-commit");
  const baseHash = new CommitExplorer().getBaseCommitHash();
  assert.equal(null, baseHash);
});

/*
 * (HEAD -> master) two commit
 * first commit
 */
test("master two commits", () => {
  copyGitFiles("master-two-commits");
  const baseHash = new CommitExplorer().getBaseCommitHash();
  assert.equal(null, baseHash);
});

/*
 * (HEAD -> feat-y, master) second commit
 * first commit
 */
test("after create new branch", () => {
  copyGitFiles("after-create-new-branch");
  const baseHash = new CommitExplorer().getBaseCommitHash();
  assert.equal(null, baseHash);
});

/*
 * (HEAD -> feat-y) y1
 * (tag: expected, master) second commit
 * first commit
 */
test("commit after create new branch", () => {
  copyGitFiles("commit-new-branch");
  const baseHash = new CommitExplorer().getBaseCommitHash();
  const expected = execSync("git rev-parse expected", { encoding: "utf8" }).trim();
  assert.equal(expected, baseHash);
});

/*
 * (HEAD -> feat-y) y2
 * y1
 * (tag: expected, master) second commit
 * first commit
 */
test("two commits after create new branch", () => {
  copyGitFiles("two-commit-new-branch");
  const baseHash = new CommitExplorer().getBaseCommitHash();
  const expected = execSync("git rev-parse expected", { encoding: "utf8" }).trim();
  assert.equal(expected, baseHash);
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
test("after catch up master merge", () => {
  copyGitFiles("after-catch-up-master");
  const baseHash = new CommitExplorer().getBaseCommitHash();
  const expected = execSync("git rev-parse expected", { encoding: "utf8" }).trim();
  assert.equal(expected, baseHash);
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
test("commit after merge", () => {
  copyGitFiles("commit-after-merge");
  const baseHash = new CommitExplorer().getBaseCommitHash();
  const expected = execSync("git rev-parse expected", { encoding: "utf8" }).trim();
  assert.equal(expected, baseHash);
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

test("master to catch up branch", () => {
  copyGitFiles("master-to-catch-up-branch");
  const baseHash = new CommitExplorer().getBaseCommitHash();
  const expected = execSync("git rev-parse expected", { encoding: "utf8" }).trim();
  assert.equal(expected, baseHash);
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

test("commit after catch up and merge", () => {
  copyGitFiles("commit-after-catch-up-and-merge");
  const baseHash = new CommitExplorer().getBaseCommitHash();
  const expected = execSync("git rev-parse expected", { encoding: "utf8" }).trim();
  assert.equal(expected, baseHash);
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
test("after merge catch up", () => {
  copyGitFiles("after-merge-catch-up");
  const baseHash = new CommitExplorer().getBaseCommitHash();
  const expected = execSync("git rev-parse expected", { encoding: "utf8" }).trim();
  assert.equal(expected, baseHash);
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
test("merge catch up and commit", () => {
  copyGitFiles("merge-catch-up-then-commit");
  const baseHash = new CommitExplorer().getBaseCommitHash();
  const expected = execSync("git rev-parse expected", { encoding: "utf8" }).trim();
  assert.equal(expected, baseHash);
});

// *---.   merge branch11 branch2 branch3 to master
// |\ \ \
// | | | * branch3 commit
// | |_|/
// |/| |
// | | * branch2 commit
// | |/
// |/|
// | * branch1 commit
// |/
// * (tag: expected) init import
test("merge multipe commit three", () => {
  copyGitFiles("merge-multipe-commit-three");
  const baseHash = new CommitExplorer().getBaseCommitHash();
  const expected = execSync("git rev-parse expected", { encoding: "utf8" }).trim();
  assert.equal(expected, baseHash);
});

test("error patter found in reg-suit repository", () => {
  copyGitFiles("reg-suit-error-pattern");
  const baseHash = new CommitExplorer().getBaseCommitHash();
  const expected = "49d38a929ae3675a1c79216709c35884f0b78900";
  assert.equal(expected, baseHash);
});
