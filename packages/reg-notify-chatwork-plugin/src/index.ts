import { NotifierPluginFactory } from "reg-suit-interface";
import { ChatworkNotifierPlugin } from "./chatwork-notifier-plugin";
import { ChatworkPreparer } from "./chatwork-preparer";

const pluginFactory: NotifierPluginFactory = () => {
  return {
    notifier: new ChatworkNotifierPlugin(),
    preparer: new ChatworkPreparer(),
  };
};

export = pluginFactory;
