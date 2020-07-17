import {
  KeyGeneratorPlugin,
  PluginCreateOptions,
  KeyGeneratorPluginFactory,
} from "reg-suit-interface";

class GitStrategyhKeyGenPlugin implements KeyGeneratorPlugin<{}> {
  private _conf!: PluginCreateOptions<{}>;

  init(config: PluginCreateOptions<{}>): void {
    this._conf = config;
  }

  getExpectedKey(): Promise<string> {
    return Promise.resolve("");
  }

  getActualKey(): Promise<string> {
    return Promise.resolve("");
  }
}

const pluginFactory: KeyGeneratorPluginFactory = () => {
  return {
    keyGenerator: new GitStrategyhKeyGenPlugin(),
  };
};

export = pluginFactory;
