import { NotifierPluginFactory } from "reg-suit-interface";
import { GhApiNotifierPlugin } from "./gh-api-notifier-plugin";

const factory: NotifierPluginFactory = () => {
  return {
    notifier: new GhApiNotifierPlugin(),
  };
};

export = factory;
