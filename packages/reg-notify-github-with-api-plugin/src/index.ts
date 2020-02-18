import { NotifierPluginFactory } from "reg-suit-interface";
import { GhApiNotifierPlugin } from "./gh-api-notifier-plugin";
import { GhApiPreparer } from "./gh-api-preparer";

const factory: NotifierPluginFactory = () => {
  return {
    notifier: new GhApiNotifierPlugin(),
    preparer: new GhApiPreparer(),
  };
};

export = factory;
