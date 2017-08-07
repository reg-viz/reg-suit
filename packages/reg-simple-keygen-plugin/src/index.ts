import { KeyGeneratorPluginFactory } from "reg-suit-interface";
import { SimpleKeygenPlugin, PluginConfig } from "./plugin";

const factory: KeyGeneratorPluginFactory = () => {
  return {
    keyGenerator: new SimpleKeygenPlugin(),
  };
};

module.exports = factory;
