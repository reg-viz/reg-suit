import { execSync } from "child_process";

export class GitCmdClient {

  private _revParseHash: { [key: string]: string; } = {};

  currentName() {
    return execSync("git branch | grep \"^\\*\" | cut -b 3-", { encoding: "utf8" });
  }

  revParse(currentName: string, n?: number) {
    const key = typeof n === "undefined" ? currentName : currentName + n;
    if (!this._revParseHash[key]) {
      this._revParseHash[key] = typeof n === "undefined"
        ? execSync(`git rev-parse ${currentName}`, { encoding: "utf8" })
        : execSync(`git rev-parse ${currentName}@{0} -- .`, { encoding: "utf8" });
    }
    return this._revParseHash[key];
  }

  mergeBranches(hash: string) {
    return execSync(`git branch -a --merged ${hash}`, { encoding: "utf8" });
  }

  containedBranches(hash: string): string {
    return execSync(`git branch -a --contains ${hash}`, { encoding: "utf8" });
  }

  log() {
    return execSync("git log -n 300 --oneline", { encoding: "utf8" });
  }

  logMerges() {
    return execSync("git log -n 300 --oneline --all --merges", { encoding: "utf8" });
  }

  logBetween(a: string, b: string) {
    return execSync(`git log -n 300 --oneline ${a}..${b}`, { encoding: "utf8" });
  }

  logFirstParent() {
    return execSync("git log -n 300 --oneline --first-parent", { encoding: "utf8" });
  }

  logGraph() {
    return execSync("git log -n 300 --graph --pretty=format:\"%h %p\"", { encoding: "utf8" });
  }
}
