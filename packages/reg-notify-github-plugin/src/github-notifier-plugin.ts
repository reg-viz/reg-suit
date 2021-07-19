import path from "path";
import { Repository } from "tiny-commit-walker";
import { inflateRawSync } from "zlib";
import { getGhAppInfo, BaseEventBody, CommentToPrBody, UpdateStatusBody } from "reg-gh-app-interface";
import { fsUtil } from "reg-suit-util";
import { NotifierPlugin, NotifyParams, PluginCreateOptions, PluginLogger } from "reg-suit-interface";

import rp from "request-promise";

type PrCommentBehavior = "default" | "once" | "new";

export interface GitHubPluginOption {
  clientId?: string;
  installationId?: string;
  owner?: string;
  repository?: string;
  prComment?: boolean;
  prCommentBehavior?: PrCommentBehavior;
  setCommitStatus?: boolean;
  customEndpoint?: string;
}

interface GhAppStatusCodeError {
  name: "StatusCodeError";
  statusCode: number;
  error: {
    message: string;
  };
}

function isGhAppError(x: any): x is GhAppStatusCodeError {
  return x.name && x.name === "StatusCodeError";
}

const errorHandler = (logger: PluginLogger) => {
  return (reason: any) => {
    if (isGhAppError(reason)) {
      logger.error(reason.error.message);
      return Promise.reject(reason.error);
    } else {
      return Promise.reject(reason);
    }
  };
};

export class GitHubNotifierPlugin implements NotifierPlugin<GitHubPluginOption> {
  _logger!: PluginLogger;
  _noEmit!: boolean;
  _apiOpt!: BaseEventBody;
  _prComment!: boolean;
  _setCommitStatus!: boolean;
  _behavior!: PrCommentBehavior;

  _apiPrefix!: string;
  _repo!: Repository;
  _projectName: string | undefined;

  _decodeClientId(clientId: string) {
    const tmp = inflateRawSync(new Buffer(clientId, "base64")).toString().split("/");
    if (tmp.length !== 4) {
      this._logger.error(`Invalid client ID: ${this._logger.colors.red(clientId)}`);
      throw new Error(`Invalid client ID: ${clientId}`);
    }
    const [repository, installationId, owner] = tmp.slice(1);
    return { repository, installationId, owner };
  }

  init(config: PluginCreateOptions<GitHubPluginOption>) {
    this._noEmit = config.noEmit;
    this._logger = config.logger;
    if (config.options.clientId) {
      this._apiOpt = this._decodeClientId(config.options.clientId);
    } else {
      this._apiOpt = config.options as BaseEventBody;
    }
    this._prComment = config.options.prComment !== false;
    this._behavior = config.options.prCommentBehavior ?? "default";
    this._setCommitStatus = config.options.setCommitStatus !== false;
    this._apiPrefix = config.options.customEndpoint || getGhAppInfo().endpoint;
    this._repo = new Repository(path.join(fsUtil.prjRootDir(".git"), ".git"));
    this._projectName = config.projectConfig.name;
  }

  notify(params: NotifyParams): Promise<any> {
    const head = this._repo.readHeadSync();
    const { failedItems, newItems, deletedItems, passedItems } = params.comparisonResult;
    const failedItemsCount = failedItems.length;
    const newItemsCount = newItems.length;
    const deletedItemsCount = deletedItems.length;
    const passedItemsCount = passedItems.length;
    const state = failedItemsCount + newItemsCount + deletedItemsCount === 0 ? "success" : "failure";

    const name = this._projectName;
    const formattedName = `${name && `${name}: `}`;
    const description =
      state === "success" ? `${formattedName}Regression testing passed` : `${formattedName}Regression testing failed`;
    let sha1: string;

    if (head.branch) {
      sha1 = head.branch.commit.hash;
    } else if (head.commit) {
      sha1 = head.commit.hash;
    } else {
      this._logger.error("Can't detect HEAD branch or commit.");
      return Promise.resolve();
    }

    const updateStatusBody: UpdateStatusBody = {
      ...this._apiOpt,
      sha1,
      description,
      state,
    };
    if (params.reportUrl) updateStatusBody.reportUrl = params.reportUrl;
    if (this._prComment) {
      updateStatusBody.metadata = { failedItemsCount, newItemsCount, deletedItemsCount, passedItemsCount };
    }

    const reqs = [];

    if (this._setCommitStatus) {
      const statusReq: any = {
        uri: `${this._apiPrefix}/api/update-status`,
        method: "POST",
        body: updateStatusBody,
        json: true,
        context: name,
      };
      this._logger.info(`Update status for ${this._logger.colors.green(updateStatusBody.sha1)} .`);
      this._logger.verbose("update-status: ", statusReq);
      reqs.push(statusReq);
    }

    if (this._prComment) {
      if (head.type === "branch" && head.branch) {
        const prCommentBody: CommentToPrBody = {
          ...this._apiOpt,
          behavior: this._behavior,
          branchName: head.branch.name,
          headOid: sha1,
          failedItemsCount,
          newItemsCount,
          deletedItemsCount,
          passedItemsCount,
        };
        if (params.reportUrl) prCommentBody.reportUrl = params.reportUrl;
        const commentReq: rp.OptionsWithUri = {
          uri: `${this._apiPrefix}/api/comment-to-pr`,
          method: "POST",
          body: prCommentBody,
          json: true,
        };
        this._logger.info(`Comment to PR associated with ${this._logger.colors.green(prCommentBody.branchName)} .`);
        this._logger.verbose("PR comment: ", commentReq);
        reqs.push(commentReq);
      } else {
        this._logger.warn(`HEAD is not attached into any branches.`);
      }
    }
    if (this._noEmit) {
      return Promise.resolve();
    }
    const spinner = this._logger.getSpinner("sending notification to GitHub...");
    spinner.start();
    return Promise.all(reqs.map(r => rp(r).catch(errorHandler(this._logger))))
      .then(() => spinner.stop())
      .catch(() => spinner.stop());
  }
}
