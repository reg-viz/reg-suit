import { execSync } from "child_process";

export class GitCmdClient {

  private _revParseHash: { [key: string]: string; } = {};

  currentName() {
    return execSync("git branch | grep \"^\\*\" | cut -b 3-", { encoding: "utf8" });
  }

  revParse(currentName: string) {
    if (!this._revParseHash[currentName]) {
      this._revParseHash[currentName] = execSync(`git rev-parse ${currentName}`, { encoding: "utf8" });
    }
    return this._revParseHash[currentName];
  }

  branches() {
    return execSync("git branch -a", { encoding: "utf8" });
  }

  containedBranches(hash: string): string {
    return execSync(`git branch -a --contains ${hash}`, { encoding: "utf8" });
  }

  logParent(hash: string) {
    return execSync(`git log --pretty=%P -n 1 ${hash}`, { encoding: "utf8" });
  }

  logTime(hash: string) {
    return execSync(`git log --pretty=%ci -n 1 ${hash}`, { encoding: "utf8" });
  }

  logBetween(a: string, b: string) {
    return execSync(`git log --oneline ${a}..${b}`, { encoding: "utf8" });
  }

  logGraph() {
    return execSync("git log -n 300 --graph --pretty=format:\"%h %p\"", { encoding: "utf8" });
  }

  showBranch(a: string) {
    return execSync(`git show-branch --sha1-name ${a} | tail -1`, { encoding: "utf8" });
  }
}
