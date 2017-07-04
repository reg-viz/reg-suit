import {
  KeyGeneratorPlugin,
  PluginCreateOptions,
  KeyGeneratorPluginFactory
} from "reg-suit-interface";

import { CommitExplorer } from "./commit-explorer";

class GitHashKeyGenPlugin implements KeyGeneratorPlugin<null> {

  private _explorer = new CommitExplorer();

  init(config: PluginCreateOptions<null>): void { }

  getExpectedKey(): Promise<string> {
    const result = this._explorer.getBaseCommitHash();
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
