import { NotifierPluginFactory } from "reg-suit-interface";
import { GhApiNotifierPlugin } from "./gh-api-notifier-plugin";
import { GhApiPreparer } from "./gh-api-preparer";

export { GhGqlClient as GithubCommentClient } from "./gh-gql-client";

const factory: NotifierPluginFactory = () => {
  return {
    notifier: new GhApiNotifierPlugin(),
    preparer: new GhApiPreparer(),
  };
};

export default factory;
