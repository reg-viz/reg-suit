"use strict";
// This source code is plagiarized from https://github.com/bokuweb/git-base-hash/blob/master/index.js
Object.defineProperty(exports, "__esModule", { value: true });
const { execSync } = require("child_process");
function baseHash() {
    const currentName = execSync("git branch | grep \"^\\*\" | cut -b 3-", { encoding: "utf8" });
    const shownBranches = execSync("git show-branch -a --sha1-name", { encoding: "utf8" }).split(/\n/);
    const separatorIndex = shownBranches.findIndex((b) => /^--/.test(b));
    const branches = [];
    const currentHash = execSync(`git rev-parse ${currentName}`, { encoding: "utf8" }).replace("\n", "");
    const firstParentHashes = execSync("git log -n 1000 --oneline --first-parent", { encoding: "utf8" }).split("\n").map((log) => log.split(" ")[0]);
    let currentIndex;
    let baseHash = "";
    shownBranches
        .slice(0, separatorIndex)
        .forEach((b, i) => {
        const name = b.replace(/\].+/, "").match(/\[(.+)/)[1];
        if (!name)
            return;
        if (b[i] === "*")
            currentIndex = i;
        branches.push(name);
    });
    const candidateHashes = shownBranches
        .slice(separatorIndex + 1, shownBranches.length - 1)
        .filter(b => {
        const [status, branch] = b.replace(/\].+/, "").split("[");
        const isCurrent = status[currentIndex] === "*" || status[currentIndex] === "-";
        if (!isCurrent)
            return;
        return [...status]
            .map((s, i) => {
            if (i === currentIndex)
                return;
            if (s === " ")
                return;
            const name = branches[i];
            const hash = execSync(`git rev-parse ${name}`, { encoding: "utf8" }).replace("\n", "");
            if (hash === currentHash)
                return;
            return true;
        })
            .filter(s => !!s).length;
    })
        .map(b => b.replace(/\].+/, "").match(/\[(.+)/)[1])
        .filter(hash => currentHash.indexOf(hash));
    if (!candidateHashes.length)
        return null;
    candidateHashes
        .some(hash => {
        if (firstParentHashes.indexOf(hash) === -1)
            return false;
        baseHash = hash;
        return true;
    });
    const parents = execSync("git log -n 1000 --graph --pretty=format:\"%h %p\"", { encoding: "utf8" })
        .split("\n")
        .map((hashes) => (hashes
        .replace(/\*|\/|\||/g, "")
        .split(" ")
        .filter(hash => !!hash)))
        .filter((hashes) => hashes.length);
    const findParentNode = (parentHash) => parents.find(([hash]) => hash === parentHash);
    const traverseLog = (candidateHash) => {
        const [target, ...parentHashes] = findParentNode(candidateHash);
        for (const h of parentHashes) {
            if (target === baseHash)
                return true;
            return traverseLog(h);
        }
    };
    const target = candidateHashes.find(traverseLog);
    return execSync(`git rev-parse ${target}`, { encoding: "utf8" }).replace("\n", "");
}
exports.default = baseHash;
