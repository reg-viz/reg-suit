import { GitCmdClient } from "./git-cmd-client";

export type CommitNode = string[];

export class CommitExplorer {
  private _gitCmdClient = new GitCmdClient();
  private _commitNodes!: CommitNode[];
  private _branchName!: string;
  private _branchNameCache: { [hash: string]: string[] } = {};

  /*
   * e.g. return `[["a38df15", "8e1ac3a"], ["8e1ac3a", "7ba8507"]]`.
   *      The first element of node means commit hash, rest elements means parent commit hashes.
   */
  getCommitNodes(): CommitNode[] {
    return this._gitCmdClient
      .logGraph()
      .split("\n")
      .map((hashes: string) =>
        hashes
          .replace(/\*|\/|\||\\|_|-+\.|/g, "")
          .split(" ")
          .filter(hash => !!hash),
      )
      .filter((hashes: CommitNode) => hashes.length);
  }

  /*
   * e.g. return `master`.
   */
  getCurrentBranchName(): string {
    const currentName = this._gitCmdClient.currentName().replace("\n", "");
    if (
      currentName.startsWith("(HEAD detached") ||
      currentName.startsWith("(no branch") ||
      currentName.startsWith("(detached from") ||
      (currentName.startsWith("[") && currentName.indexOf("detached") !== -1)
    ) {
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

  /*
   * Return branch name including target hash.
   * e.g. `["master", "feat-x"]`.
   */
  getBranchNames(hash: string): string[] {
    if (this._branchNameCache[hash]) return this._branchNameCache[hash];
    const names = this._gitCmdClient
      .containedBranches(hash)
      .split("\n")
      .filter(h => !!h)
      .map(branch => branch.replace("*", "").trim());
    this._branchNameCache[hash] = names;
    return names;
  }

  getAllBranchNames(): string[] {
    return this._gitCmdClient
      .branches()
      .split("\n")
      .map(b => b.replace(/^\*/, "").trim().split(" ")[0])
      .filter(b => !!b || b === this._branchName)
      .filter((x, i, self) => self.indexOf(x) === i);
  }

  getIntersection(hash: string): string | undefined {
    try {
      return this._gitCmdClient.mergeBase(hash, this._branchName).slice(0, 8);
    } catch (e) {}
  }

  getBranchHash(): string | undefined {
    const branches = this.getAllBranchNames();
    return branches
      .map(b => {
        const hash = this.getIntersection(b);
        const time = hash ? new Date(this._gitCmdClient.logTime(hash).trim()).getTime() : Number.MAX_SAFE_INTEGER;
        return { hash, time };
      })
      .filter(a => !!a.hash)
      .sort((a, b) => a.time - b.time)
      .map(b => b.hash)[0];
  }

  getCandidateHashes(): string[] {
    const mergedBranches = this.getBranchNames(this._commitNodes[0][0]).filter(
      b => !b.endsWith("/" + this._branchName) && b !== this._branchName,
    );
    return this._commitNodes
      .map(c => c[0])
      .filter(c => {
        const branches = this.getBranchNames(c);
        const hasCurrent = !!branches.find(b => this._branchName === b);
        const others = branches.filter(b => {
          return !(b.endsWith(this._branchName) || (mergedBranches.length && mergedBranches.some(c => b === c)));
        });
        return hasCurrent && !!others.length;
      });
  }

  isReachable(a: string, b: string) {
    const between = this._gitCmdClient.logBetween(a, b).trim();
    return !between;
  }

  findBaseCommitHash(candidateHashes: string[], branchHash: string): string | undefined {
    const traverseLog = (candidateHash: string): boolean | undefined => {
      if (candidateHash === branchHash) return true;
      return this.isReachable(candidateHash, branchHash);
    };
    const target = candidateHashes.find(hash => !!traverseLog(hash));
    return target;
  }

  getBaseCommitHash(): string | null {
    this._branchName = this.getCurrentBranchName();
    this._commitNodes = this.getCommitNodes();
    const candidateHashes = this.getCandidateHashes();
    const branchHash = this.getBranchHash();
    if (!branchHash) return null;
    const baseHash = this.findBaseCommitHash(candidateHashes, branchHash);
    if (!baseHash) return null;
    const result = this._gitCmdClient.revParse(baseHash).replace("\n", "");
    return result ? result : null;
  }
}
