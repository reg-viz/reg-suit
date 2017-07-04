import { execSync } from "child_process";

export class GitCmdClient {

  currentName() {
    return execSync("git branch | grep \"^\\*\" | cut -b 3-", { encoding: "utf8" });
  }

  revPerse(currentName: string) {
    return execSync(`git rev-parse ${currentName}`, { encoding: "utf8" });
  }

  showBranch() {
    return execSync("git show-branch -a --sha1-name", { encoding: "utf8" });
  }

  logGraph() {
    return execSync("git log -n 1000 --graph --pretty=format:\"%h %p\"", { encoding: "utf8" });
  }

}
