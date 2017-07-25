import {
  KeyGeneratorPlugin,
  PluginCreateOptions,
  KeyGeneratorPluginFactory
} from "reg-suit-interface";

import { CommitExplorer } from "./commit-explorer";

type ExpectedType = "rev" | "base-commit";

interface PluginOption {
  expectedType?: ExpectedType;
  expectedRev?: string;
}

class GitHashKeyGenPlugin implements KeyGeneratorPlugin<PluginOption> {

  private _explorer = new CommitExplorer();
  private _type: ExpectedType = "base-commit";
  private _expectedRev: string;

  init(config: PluginCreateOptions<PluginOption>): void {
    if (config.options.expectedType) {
      this._type = config.options.expectedType;
      if (this._type === "rev") {
        const rev = config.options.expectedRev;
        if (!rev || rev === "") {
          const msg = "Invalid configuration. 'expectedRev' should be set when 'expectedType' is 'rev'.";
          config.logger.error(msg);
          throw new Error(msg);
        }
        this._expectedRev = rev;
      }
    }
  }

  getExpectedKey(): Promise<string> {
    let result: string | null = null;
    switch (this._type) {
      case "rev":
        result = this._explorer.getHashFromName(this._expectedRev);
        break;
      case "base-commit":
      default:
        result = this._explorer.getBaseCommitHash();
        break;
    }
    if (result) {
      return Promise.resolve(result);
    } else {
      return Promise.reject<string>(null);
    }
  }

  getActualKey(): Promise<string> {
    return Promise.resolve(this._explorer.getCurrentCommitHash());
  }
}

const pluginFactory: KeyGeneratorPluginFactory = () => {
  return {
    keyGenerator: new GitHashKeyGenPlugin(),
  };
};

export = pluginFactory;
