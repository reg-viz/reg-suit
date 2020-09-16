import { KeyGeneratorPluginFactory } from "reg-suit-interface";
import { SimpleKeygenPlugin } from "./plugin";

const factory: KeyGeneratorPluginFactory = () => {
  return {
    keyGenerator: new SimpleKeygenPlugin(),
  };
};

module.exports = factory;
