import { GitCmdClient } from "./git-cmd-client";

export type CommitNode = string[];

export class CommitExplorer {

  private _gitCmdClient = new GitCmdClient();
  private _commitNodes: CommitNode[];
  private _branchName: string;

  /*
   * e.g. return `[["a38df15", "8e1ac3a"], ["8e1ac3a", "7ba8507"]]`.
   *      The first element of node means commit hash, rest elements means parent commit hashes.
  */
  getCommitNodes(): CommitNode[] {
    return this._gitCmdClient.logGraph()
      .split("\n")
      .map((hashes: string) => (
        hashes
          .replace(/\*|\/|\||\\|_|/g, "")
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
    const currentName = this._branchName;
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
    return this._commitNodes
      .filter(([_, ...parent]) => !!parent.find(h => h === hash));
  }

  /*
   * e.g. return `["a38df15", "8e1ac3a"]`.
  */
  findParentNode(parentHash: string): CommitNode | undefined {
    return this._commitNodes
      .find(([hash]: string[]) => hash === parentHash);
  }

  /*
   * Return branch name including target hash.
   * e.g. `["master", "feat-x"]`.
  */
  getBranchNames(hash: string): string[] {
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
   * 2. Child's branch number is larger than parent's branch number.
   * 
  */
  isBranchHash(hash: string): boolean {
    const children = this.findChildren(hash);
    const branchNumOnTargetHash = this.getBranchNames(hash).length;
    const mergedHashes = this.getParentHashes(this._gitCmdClient.logMerges());
    return children.some(([childHash]) => {
      const branches = this.getBranchNames(childHash);
      const hasCurrentBranch = branches.includes(this._branchName);
      return hasCurrentBranch && (branchNumOnTargetHash > branches.length);
    });
  }

  getBranchHash(candidateHashes: string[]): string | undefined {
    const firstParents = this.getParentHashes(this._gitCmdClient.logFirstParent());
    return firstParents.find((hash, i) => this.isBranchHash(hash));
  }

  getCandidateHashes(): string[] {
    const currentBranch = this._branchName;
    return this._commitNodes
      .map((c) => c[0])
      .filter((c, i) => {
        if (i === 0) return;
        const branches = this.getBranchNames(c);
        return !!branches.some(b => b === currentBranch) &&
          !!branches.filter(b => !b.endsWith(currentBranch)).length;
      });
  }

  getBaseCommitHash(): string | null {
    this._branchName = this.getCurrentBranchName();
    this._commitNodes = this.getCommitNodes();
    const candidateHashes = this.getCandidateHashes();
    const branchHash = this.getBranchHash(candidateHashes);
    if (!branchHash) return null;
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
