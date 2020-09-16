import { KeyGeneratorPlugin, PluginCreateOptions, KeyGeneratorPluginFactory } from "reg-suit-interface";
import { fsUtil } from "reg-suit-util";

import { CommitExplorer } from "./commit-explorer";

class GitHashKeyGenPlugin implements KeyGeneratorPlugin {
  private _explorer = new CommitExplorer();
  private _conf!: PluginCreateOptions;

  init(config: PluginCreateOptions): void {
    this._conf = config;
  }

  getExpectedKey(): Promise<string> {
    if (!this._checkAndMessage()) {
      return Promise.reject<string>(null);
    }
    try {
      const result = this._explorer.getBaseCommitHash();
      if (result) {
        return Promise.resolve(result);
      } else {
        return Promise.reject<string>(null);
      }
    } catch (e) {
      this._conf.logger.error(this._conf.logger.colors.red(e.message));
      return Promise.reject<string>(null);
    }
  }

  getActualKey(): Promise<string> {
    if (!this._checkAndMessage()) {
      return Promise.reject<string>(new Error());
    }
    return Promise.resolve(this._explorer.getCurrentCommitHash());
  }

  private _isInGitRepository() {
    return !!fsUtil.lookup(".git", this._conf.workingDirs.base);
  }

  private _checkAndMessage() {
    const result = this._isInGitRepository();
    if (!result) {
      this._conf.logger.error(
        this._conf.logger.colors.red(
          "reg-keygen-git-hash-plugin does not work outside of a Git repository. Please retry after running `git init`.",
        ),
      );
    }
    return result;
  }
}

const pluginFactory: KeyGeneratorPluginFactory = () => {
  return {
    keyGenerator: new GitHashKeyGenPlugin(),
  };
};

export = pluginFactory;
