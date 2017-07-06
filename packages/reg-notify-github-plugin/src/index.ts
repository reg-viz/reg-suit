import { NotifierPluginFactory } from "reg-suit-interface";
import { GitHubNotifierPlugin } from "./github-notifier-plugin";

const factory: NotifierPluginFactory = () => {
  return {
    notifier: new GitHubNotifierPlugin(),
  };
};

export = factory;
