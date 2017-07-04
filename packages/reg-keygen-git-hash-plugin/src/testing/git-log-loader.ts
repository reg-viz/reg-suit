import * as fs from "fs";
import * as path from "path";

import { GitCmdClient } from "../git-cmd-client";

export class GitLogLoader implements GitCmdClient {

  private _loadFile(name: string) {
    return fs.readFileSync(path.join(path.resolve(__dirname, "../../test/fixture"), this._dirname, name), "utf8");
  }

  constructor(private _dirname: string) { }

  currentName(): string {
    return this._loadFile("current-name.txt");
  }

  revParse(currentName: string): string {
    return this._loadFile(`rev-parse_${currentName}.txt`);
  }

  showBranch(): string {
    return this._loadFile("show-branch.txt");
  }

  logFirstParent(): string {
    return this._loadFile("log-first-parent.txt");
  }

  logGraph(): string {
    return this._loadFile("log-graph.txt");
  }

}
