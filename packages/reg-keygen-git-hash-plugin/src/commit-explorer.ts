// This source code is plagiarized from https://github.com/bokuweb/git-base-hash/blob/master/index.js
import { GitCmdClient } from "./git-cmd-client";

export class CommitExplorer {

  _gitCmdClient = new GitCmdClient();

  getCurrentCommitHash(): string {
    const currentName = this._gitCmdClient.currentName().replace("\n", "");
    if (!currentName.length) {
      throw new Error("Fail to detect the current branch.");
    }
    return this._gitCmdClient.revParse(currentName).replace("\n", "");
  }

  getBaseCommitHash(): string | null {
    const shownBranches = this._gitCmdClient.showBranch().split(/\n/) as string[];
    const separatorIndex = shownBranches.findIndex((b) => /^--/.test(b));
    const branches: string[] = [];
    const current = this.getCurrentCommitHash();
    const firstParentHashes = this._gitCmdClient.logFirstParent().split("\n").filter(l => !!l.length).map((log: string) => log.split(" ")[0]);
    let currentIndex: number;
    let baseHash = "";
    shownBranches
      .slice(0, separatorIndex)
      .forEach((b, i) => {
        const name = (b.replace(/\].+/, "").match(/\[(.+)/) as any)[1];
        if (!name) return;
        if (b[i] === "*") currentIndex = i;
        branches.push(name);
      });
    const candidateHashes = shownBranches
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
      .filter(hash => current.indexOf(hash)) as string[]
    ;
    if (!candidateHashes.length) return null;
    candidateHashes
      .some(hash => {
        if (firstParentHashes.indexOf(hash) === -1) return false;
        baseHash = hash;
        return true;
      });
    const parents = this._gitCmdClient.logGraph()
      .split("\n")
      .map((hashes: string) => (
        hashes
          .replace(/\*|\/|\||/g, "")
          .split(" ")
          .filter(hash => !!hash)
      ))
      .filter((hashes: string[]) => hashes.length);
    const findParentNode = (parentHash: string) => parents.find(([hash]: any[]) => hash === parentHash);
    const traverseLog = (candidateHash: any): any => {
      const hits = findParentNode(candidateHash);
      if (!hits) {
        // FIXME?
        return false;
      }
      const [target, ...parentHashes] = hits;
      for (const h of parentHashes) {
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
