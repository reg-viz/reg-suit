import { execSync } from "child_process";

export class GitCmdClient {

  currentName() {
    return execSync("git branch | grep \"^\\*\" | cut -b 3-", { encoding: "utf8" });
  }

  revParse(currentName: string) {
    return execSync(`git rev-parse ${currentName}`, { encoding: "utf8" });
  }

  showBranch() {
    return execSync("git show-branch -a --sha1-name", { encoding: "utf8" });
  }

  logFirstParent() {
    // TODO need review.
    // the --first-parent option sometimes hides base hash candidates,,, is it correct?
    // return execSync("git log -n 1000 --oneline --first-parent", { encoding: "utf8" });
    return execSync("git log -n 1000 --oneline", { encoding: "utf8" });
  }

  logGraph() {
    return execSync("git log -n 1000 --graph --pretty=format:\"%h %p\"", { encoding: "utf8" });
  }

}
