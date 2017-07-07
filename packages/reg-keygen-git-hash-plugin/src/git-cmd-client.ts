import { execSync } from "child_process";

export class GitCmdClient {

  private _revParseHash: { [key: string]: string; } = { };

  currentName() {
    return execSync("git branch | grep \"^\\*\" | cut -b 3-", { encoding: "utf8" });
  }

  revParse(currentName: string) {
    if (!this._revParseHash[currentName]) {
      this._revParseHash[currentName] = execSync(`git rev-parse ${currentName}`, { encoding: "utf8" });
    }
    return this._revParseHash[currentName];
  }

  showBranch() {
    return execSync("git show-branch -a --sha1-name", { encoding: "utf8" });
  }

  logFirstParent() {
    return execSync("git log -n 1000 --oneline", { encoding: "utf8" });
  }

  logGraph() {
    return execSync("git log -n 1000 --graph --pretty=format:\"%h %p\"", { encoding: "utf8" });
  }

}
