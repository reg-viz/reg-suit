import {
  KeyGeneratorPlugin,
  PluginCreateOptions,
  KeyGeneratorPluginFactory
} from "reg-suit-interface";
import { baseHash, currentHash } from "./base-hash";

class GitHashKeyGenPlugin implements KeyGeneratorPlugin<null> {
  init(config: PluginCreateOptions<null>): void { }

  getExpectedKey(): Promise<string> {
    const result = baseHash();
    if (result) {
      return Promise.resolve(result);
    } else {
      return Promise.reject<string>(null);
    }
  }

  getActualKey(): Promise<string> {
    return Promise.resolve(currentHash());
  }
}

const pluginFactory: KeyGeneratorPluginFactory = () => {
  return {
    keyGenerator: new GitHashKeyGenPlugin(),
  };
};

export = pluginFactory;
