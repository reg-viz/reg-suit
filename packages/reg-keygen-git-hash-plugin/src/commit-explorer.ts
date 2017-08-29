import { GitCmdClient } from "./git-cmd-client";

export type CommitNode = string[];

export class CommitExplorer {

  _gitCmdClient = new GitCmdClient();

  /*
   * e.g. return `[["a38df15", "8e1ac3a"], ["8e1ac3a", "7ba8507"]]`.
   *      The first element of node means commit hash, rest elements means parent commit hashes.
  */
  get commitNodes(): CommitNode[] {
    return this._gitCmdClient.logGraph()
      .split("\n")
      .map((hashes: string) => (
        hashes
          .replace(/\*|\/|\||\\|/g, "")
          .split(" ")
          .filter(hash => !!hash)
      ))
      .filter((hashes: CommitNode) => hashes.length);
  }

  /*
   * e.g. return `master`.
  */
  getCurrentBranchName(): string {
    const currentName = this._gitCmdClient.currentName().replace("\n", "");
    if (currentName.startsWith("(HEAD detached") ||
      currentName.startsWith("(no branch") ||
      currentName.startsWith("(detached from") ||
      (currentName.startsWith("[") && currentName.indexOf("detached") !== -1)) {
      throw new Error("Can't detect branch name because HEAD is on detached commit node.");
    }
    return currentName;
  }

  /*
   * e.g. return `ede92258d154f1ba1e88dc109a83b9ba143d561e`.
  */
  getCurrentCommitHash(): string {
    const currentName = this.getCurrentBranchName();
    if (!currentName || !currentName.length) {
      throw new Error("Fail to detect the current branch.");
    }
    return this._gitCmdClient.revParse(currentName).replace("\n", "");
  }

  getParentHashes(log: string): string[] {
    return log.split("\n")
      .filter(l => !!l.length)
      .map((log: string) => log.split(" ")[0]);
  }

  findChildren(hash: string): CommitNode[] {
    return this.commitNodes
      .filter(([_, ...parent]) => !!parent.find(h => h === hash));
  }

  /*
   * e.g. return `["a38df15", "8e1ac3a"]`.
  */
  findParentNode(parentHash: string): CommitNode | undefined {
    return this.commitNodes
      .find(([hash]: string[]) => hash === parentHash);
  }


  /*
   * Return branch number including target hash.
  */
  getBranchNumOnHash(hash: string): number {
    return this._gitCmdClient
      .containedBranches(hash)
      .split("\n")
      .filter(h => !!h)
      .length;
  }

  /*
   * Return branch name including target hash.
   * e.g. `["master", "feat-x"]`.
  */
  getBranchNamesOnHash(hash: string): string[] {
    return this._gitCmdClient
      .containedBranches(hash)
      .split("\n")
      .filter(h => !!h)
      .map(branch => branch.replace("*", "").trim());
  }

  /*
   * NOTE: Check if it is a branch hash
   *
   * If there is more than one hash of a child that satisfies all of the following, it is regarded as a branch hash.
   * 
   * 1. Whether the hash is included in the current branch.
   * 2. The hash is the current hash, or is not a merged hash.
   * 3. Child's branch number is larger than parent's branch number.
   * 
  */
  isBranchHash(hash: string, currentHash: string): boolean {
    const children = this.findChildren(hash);
    const branchNumOnTargetHash = this.getBranchNumOnHash(hash);
    const mergedHashes = this.getParentHashes(this._gitCmdClient.logMerges());
    return children.some(([childHash]) => {
      const branches = this.getBranchNamesOnHash(childHash);
      const hasCurrentBranch = branches.includes(this.getCurrentBranchName());
      return hasCurrentBranch &&
        (currentHash === childHash || !mergedHashes.includes(childHash)) &&
        (branchNumOnTargetHash > branches.length);
    });
  }

  getBranchHash(candidateHashes: string[]): string {
    const firstParents = this.getParentHashes(this._gitCmdClient.logFirstParent());
    const allParents = this.getParentHashes(this._gitCmdClient.log());
    const current = allParents[0];
    return firstParents.find((hash, i) => this.isBranchHash(hash, current)) ||
      allParents.find((hash, i) => this.isBranchHash(hash, current)) ||
      candidateHashes.filter(hash => firstParents.includes(hash))[0] ||
      candidateHashes.filter(hash => allParents.includes(hash))[0];
  }

  /*
   * Return branch name from `git show-branch` command result.
  */
  getBranchNames(showBranchResult: string[]): { branchNames: string[], currentBranchIndex: number } {
    const branchNames: string[] = [];
    let index: number = 0;
    showBranchResult
      .forEach((b, i) => {
        const name = (b.replace(/\].+/, "").match(/\[(.+)/) as any)[1];
        if (!name) return;
        if (b[i] === "*") index = i;
        branchNames.push(name);
      });
    return { branchNames, currentBranchIndex: index };
  }

  /*
   * Return candidate hashes from `git show-branch` command result.
   * 
   * ```
   * ! [feat-x] merge master to feat-x
   *  * [feat-y] y2
   *   ! [master] second commit
   * ---
   *  *  [5862a76] y2
   *  *  [bc93d6e] y1
   * -   [4e2e108] merge master to feat-x
   * +*+ [c78b074] second commit
   * ```
   * If `git show-branch` command output above result, return following array as candidate hashes.
   *
   * ```
   *   [ 'c78b074' ]
   * ```
  */
  getCandidateHashes(showBranchResult: string[]): string[] {
    const current = this.getCurrentCommitHash();
    const separatorIndex = showBranchResult.findIndex((b) => /^--/.test(b));
    const { branchNames, currentBranchIndex } = this.getBranchNames(showBranchResult.slice(0, separatorIndex));
    const markedNum = (status: string) => (
      [...status].filter((s, i) => {
        if (i === currentBranchIndex) return;
        if (s === " ") return;
        const name = branchNames[i];
        const hash = this._gitCmdClient.revParse(name).replace("\n", "");
        if (hash === current) return;
        return true;
      }).length
    );
    return showBranchResult
      .slice(separatorIndex + 1, showBranchResult.length - 1)
      .filter(b => {
        const [status, branch] = b.replace(/\].+/, "").split("[");
        const isCurrent = status[currentBranchIndex] === "*" || status[currentBranchIndex] === "-";
        if (!isCurrent) return;
        return markedNum(status);
      })
      .map(b => (b.replace(/\].+/, "").match(/\[(.+)/) as any)[1])
      .filter(hash => current.indexOf(hash));
  }

  getBaseCommitHash(): string | null {
    const showBranchResult = this._gitCmdClient.showBranch().split(/\n/) as string[];
    const candidateHashes = this.getCandidateHashes(showBranchResult);
    const branchHash = this.getBranchHash(candidateHashes);
    const baseHash = this.findBaseCommitHash(candidateHashes);
    if (!baseHash) return null;
    const result = this._gitCmdClient.revParse(baseHash).replace("\n", "");
    return result ? result : null;
  }

  findBaseCommitHash(candidateHashes: string[]): string | undefined {
    const branchHash = this.getBranchHash(candidateHashes);
    const traverseLog = (candidateHash: string): boolean | undefined => {
      if (candidateHash === branchHash) return true;
      const hits = this.findParentNode(candidateHash);
      if (!hits || !hits.length) return false;
      const [target, ...hitParentsHashes] = hits;
      for (const h of hitParentsHashes) {
        if (target === branchHash) return true;
        return traverseLog(h);
      }
    };
    const target = candidateHashes.find((hash) => !!traverseLog(hash));
    return target;
  }
}
