import { NotifierPluginFactory } from "reg-suit-interface";
import { GitLabNotifierPlugin } from "./gitlab-notifier-plugin";
import { GitLabPreparer } from "./gitlab-preparer";

const factory: NotifierPluginFactory = () => {
  return {
    notifier: new GitLabNotifierPlugin(),
    preparer: new GitLabPreparer(),
  };
};

export = factory;
