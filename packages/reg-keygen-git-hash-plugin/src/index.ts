import { KeyGeneratorPlugin, PluginCreateOptions, KeyGeneratorPluginFactory } from "reg-suit-interface";
import { fsUtil } from "reg-suit-util";

import { CommitExplorer } from "./commit-explorer";
import type { GitOptions } from "./git-cmd-client";

export interface PluginConfig {
  gitObjectHashLength?: number;
}

class GitHashKeyGenPlugin implements KeyGeneratorPlugin<PluginConfig> {
  private _explorer = new CommitExplorer();
  private _conf!: PluginCreateOptions<PluginConfig>;
  private _gitOptions!: GitOptions;

  init(config: PluginCreateOptions<PluginConfig>): void {
    this._conf = config;
    this._gitOptions = {
      objectHashLength: config.options.gitObjectHashLength || 7,
    };
  }

  getExpectedKey(): Promise<string> {
    if (!this._checkAndMessage()) {
      return Promise.reject<string>(null);
    }
    try {
      const result = this._explorer.getBaseCommitHash(this._gitOptions);
      if (result) {
        return Promise.resolve(result);
      } else {
        return Promise.reject<string>(null);
      }
    } catch (e: any) {
      this._conf.logger.error(this._conf.logger.colors.red(e.message ?? "unknown error"));
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
