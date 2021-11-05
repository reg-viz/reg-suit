import path from "path";
import { NotifierPlugin, NotifyParams, PluginCreateOptions, PluginLogger } from "reg-suit-interface";
import { fsUtil } from "reg-suit-util";
import { Repository } from "tiny-commit-walker";
import { createCommentBody } from "./create-comment";
import { GhGqlClient } from "./gh-gql-client";

export interface GhApiPluginOption {
  owner: string;
  repository: string;
  privateToken: string;
  githubUrl?: string;
  shortDescription?: boolean;
  ref?: string;
}

export class GhApiNotifierPlugin implements NotifierPlugin<GhApiPluginOption> {
  name = "reg-notify-github-with-api-plugin";

  private _logger!: PluginLogger;
  private _owner?: string;
  private _repository?: string;
  private _githubUrl!: string;
  private _token?: string;
  private _repo!: Repository;
  private _shortDescription!: boolean;
  private _ref?: string;

  init(config: PluginCreateOptions<GhApiPluginOption>) {
    this._logger = config.logger;
    this._owner = config.options.owner;
    this._repository = config.options.repository;
    this._githubUrl = config.options.githubUrl || "https://api.github.com/graphql";
    this._token = config.options.privateToken;
    this._repo = new Repository(path.join(fsUtil.prjRootDir(".git"), ".git"));
    this._shortDescription = config.options.shortDescription || false;
    this._ref = config.options.ref;
  }

  async notify(params: NotifyParams) {
    if (!this._token) {
      this._logger.warn("GitHub private access token is needed. Check plugins config.");
      return;
    }
    if (!this._owner) {
      this._logger.warn("'owner' parameter is needed. Check plugins config.");
      return;
    }
    if (!this._repository) {
      this._logger.warn("'repository' parameter is needed. Check plugins config.");
      return;
    }
    const commentBody = createCommentBody({
      reportUrl: params.reportUrl,
      passedItemsCount: params.comparisonResult.passedItems.length,
      failedItemsCount: params.comparisonResult.diffItems.length,
      newItemsCount: params.comparisonResult.newItems.length,
      deletedItemsCount: params.comparisonResult.deletedItems.length,
      shortDescription: this._shortDescription,
    });
    const client = new GhGqlClient(this._token, this._githubUrl);

    let branchName: string | undefined = undefined;

    if (this._ref) {
      if (!this._ref.startsWith("refs/heads/")) {
        this._logger.warn(`ref option does not start with 'refs/heads': "${this._ref}"`);
        return;
      }
      branchName = this._ref.replace(/^refs\/heads\//, "");
    } else {
      const head = this._repo.readHeadSync();
      if (head.type !== "branch" || !head.branch) {
        this._logger.warn("Can't detect branch name.");
        return;
      }
      branchName = head.branch.name;
    }
    if (!branchName) {
      this._logger.warn("Can't detect branch name.");
      return;
    }
    await client.postCommentToPr({
      owner: this._owner,
      repository: this._repository,
      branchName,
      body: commentBody,
    });
  }
}
