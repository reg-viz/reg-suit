import { GitCmdClient } from "./git-cmd-client";

export class CommitExplorer {

  _gitCmdClient = new GitCmdClient();

  get parents(): string[][] {
    return this._gitCmdClient.logGraph()
      .split("\n")
      .map((hashes: string) => (
        hashes
          .replace(/\*|\/|\||\\|/g, "")
          .split(" ")
          .filter(hash => !!hash)
      ))
      .filter((hashes: string[]) => hashes.length);
  }

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

  getCurrentCommitHash(): string {
    const currentName = this.getCurrentBranchName();
    if (!currentName || !currentName.length) {
      throw new Error("Fail to detect the current branch.");
    }
    return this._gitCmdClient.revParse(currentName).replace("\n", "");
  }

  findChildren(hash: string): string[][] {
    return this.parents.filter(([_, ...parent]) => !!parent.find(h => h === hash));
  }

  isBranchingPoint(hash: string, i: string): boolean {
    const children = this.findChildren(hash);
    const containedBranchesLength = this._gitCmdClient.containedBranches(hash).split("\n").filter(h => !!h).length;
    const mergedBranchesLength = this._gitCmdClient.mergeBranches(hash).split("\n").filter(h => !!h).length;
    const merges = this.getParentHashes(this._gitCmdClient.logMerges());
    return children.some(([child]) => {
      const mergedLength = this._gitCmdClient.mergeBranches(child).split("\n").filter(h => !!h).length;
      const branches = this._gitCmdClient.containedBranches(child).split("\n").filter(h => !!h).map(branch => branch.replace("*", "").trim());
      const hasCurrentBranch = branches.includes(this.getCurrentBranchName());
      return hasCurrentBranch && (i === child || !merges.includes(child)) && (containedBranchesLength > branches.length);
    });
  }


  getParentHashes(log: string): string[] {
    return log.split("\n").filter(l => !!l.length).map((log: string) => log.split(" ")[0]);
  }

  getBaseHash(candidateHashes: string[]): string {
    const firstParents = this.getParentHashes(this._gitCmdClient.logFirstParent());
    let baseHash = firstParents.find((hash, i) => this.isBranchingPoint(hash, firstParents[0])) || "";
    if (baseHash) return baseHash;
    const allParents = this.getParentHashes(this._gitCmdClient.log());
    baseHash = allParents.find((hash, i) => this.isBranchingPoint(hash, allParents[0])) || "";
    if (baseHash) return baseHash;
    baseHash = candidateHashes.filter(hash => firstParents.includes(hash))[0];
    if (baseHash) return baseHash;
    return candidateHashes.filter(hash => allParents.includes(hash))[0];
  }

  getCandidateHashes(shownBranches: string[]): string[] {
    const branches: string[] = [];
    const current = this.getCurrentCommitHash();
    const separatorIndex = shownBranches.findIndex((b) => /^--/.test(b));
    let currentIndex: number;
    shownBranches
      .slice(0, separatorIndex)
      .forEach((b, i) => {
        const name = (b.replace(/\].+/, "").match(/\[(.+)/) as any)[1];
        if (!name) return;
        if (b[i] === "*") currentIndex = i;
        branches.push(name);
      });
    return shownBranches
      .slice(separatorIndex + 1, shownBranches.length - 1)
      .filter(b => {
        const [status, branch] = b.replace(/\].+/, "").split("[");
        const isCurrent = status[currentIndex] === "*" || status[currentIndex] === "-";
        if (!isCurrent) return;
        return [...status]
          .map((s, i) => {
            if (i === currentIndex) return;
            if (s === " ") return;
            const name = branches[i];
            const hash = this._gitCmdClient.revParse(name).replace("\n", "");
            if (hash === current) return;
            return true;
          })
          .filter(s => !!s).length;
      })
      .map(b => (b.replace(/\].+/, "").match(/\[(.+)/) as any)[1])
      .filter(hash => current.indexOf(hash));
  }

  findParentNode(parentHash: string) {
    return this.parents.find(([hash]: string[]) => hash === parentHash);
  }

  getBaseCommitHash(): string | null {
    const shownBranches = this._gitCmdClient.showBranch().split(/\n/) as string[];
    const candidateHashes = this.getCandidateHashes(shownBranches);
    const baseHash = this.getBaseHash(candidateHashes);
    const traverseLog = (candidateHash: any): any => {
      if (candidateHash === baseHash) return true;
      const hits = this.findParentNode(candidateHash);
      if (!hits || !hits.length) return false;
      const [target, ...hitParentsHashes] = hits;
      for (const h of hitParentsHashes) {
        if (target === baseHash) return true;
        return traverseLog(h);
      }
    };
    const target = candidateHashes.find(traverseLog);
    if (!target) {
      return null;
    }
    const result = this._gitCmdClient.revParse(target).replace("\n", "");
    return result ? result : null;
  }

}
