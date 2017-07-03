import { NotifierPluginFactory } from "reg-suit-core/lib/plugin";
import { SlackNotifierPlugin } from "./slack-notifier-plugin";
import { SlackPreparer } from "./slack-preparer";

const pluginFactory: NotifierPluginFactory = () => {
  return {
    notifier: new SlackNotifierPlugin(),
    preparer: new SlackPreparer(),
  };
};

export = pluginFactory;
