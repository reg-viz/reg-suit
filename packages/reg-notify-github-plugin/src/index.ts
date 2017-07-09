import { NotifierPluginFactory } from "reg-suit-interface";
import { GitHubNotifierPlugin } from "./github-notifier-plugin";
import { GitHubPreparer } from "./github-preparer";

const factory: NotifierPluginFactory = () => {
  return {
    notifier: new GitHubNotifierPlugin(),
    preparer: new GitHubPreparer(),
  };
};

export = factory;
