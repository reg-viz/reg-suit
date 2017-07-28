import * as fs from "fs";
import * as path from "path";
import { inflateRawSync } from "zlib";
import { execSync } from "child_process";
import { BaseEventBody, CommentToPrBody, UpdateStatusBody } from "reg-gh-app-interface";
import {
  NotifierPlugin,
  NotifyParams,
  PluginCreateOptions,
  PluginLogger,
} from "reg-suit-interface";
import { CommitExplorer } from "reg-keygen-git-hash-plugin/lib/commit-explorer";
import { GitCmdClient } from "reg-keygen-git-hash-plugin/lib/git-cmd-client";

import * as rp from "request-promise";

export interface GitHubPluginOption {
  clientId?: string;
  installationId?: string;
  owner?: string;
  repository?: string;
  prComment?: boolean;
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

const defaultEndpoint = require("../.endpoint.json").endpoint as string;

export class GitHubNotifierPlugin implements NotifierPlugin<GitHubPluginOption> {

  _logger: PluginLogger;
  _noEmit: boolean;
  _apiOpt: BaseEventBody;
  _prComment: boolean;

  _apiPrefix: string;
  _commitExplorer: CommitExplorer;

  _decodeClientId(clientId: string) {
    const tmp = inflateRawSync(new Buffer(clientId, "base64")).toString().split("/");
    if (tmp.length !== 4) {
      this._logger.error(`Invalid client ID: ${this._logger.colors.red(clientId)}`);
      throw new Error(`Invalid client ID: ${clientId}`);
    }
    const [_, repository, installationId, owner] = tmp;
    return { repository, installationId, owner };
  }

  init(config: PluginCreateOptions<GitHubPluginOption>) {
    this._noEmit = config.noEmit;
    this._logger = config.logger;
    if (config.options.clientId) {
      this._apiOpt = this._decodeClientId(config.options.clientId);
    } else {
      this._apiOpt = (config.options as BaseEventBody);
    }
    this._prComment = config.options.prComment !== false;
    this._apiPrefix = config.options.customEndpoint || defaultEndpoint;
    this._commitExplorer = new CommitExplorer();
    this._commitExplorer._gitCmdClient = new GitCmdClient();
  }

  notify(params: NotifyParams): Promise<any> {
    const { failedItems, newItems, deletedItems, passedItems } = params.comparisonResult;
    const failedItemsCount = failedItems.length;
    const newItemsCount = newItems.length;
    const deletedItemsCount = deletedItems.length;
    const passedItemsCount = passedItems.length;
    const state = (failedItemsCount + newItemsCount + deletedItemsCount === 0) ? "success" : "failure";
    const description = state === "success" ? "Regression testing passed" : "Regression testing failed";

    const updateStatusBody: UpdateStatusBody = {
      ...this._apiOpt,
      sha1: this._commitExplorer.getCurrentCommitHash(),
      description,
      state,
    };
    if (params.reportUrl) updateStatusBody.reportUrl = params.reportUrl;
    const statusReq: rp.OptionsWithUri = {
      uri: `${this._apiPrefix}/api/update-status`,
      method: "POST",
      body: updateStatusBody,
      json: true,
    };
    this._logger.info(`Update status for ${this._logger.colors.green(updateStatusBody.sha1)} .`);
    this._logger.verbose("update-status: ", statusReq);
    const reqs = [statusReq];

    if (this._prComment) {
      const prCommentBody: CommentToPrBody = {
        ...this._apiOpt,
        branchName: this._commitExplorer.getCurrentBranchName(),
        failedItemsCount, newItemsCount, deletedItemsCount, passedItemsCount,
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
    }
    if (this._noEmit) {
      return Promise.resolve();
    }
    const spinner = this._logger.getSpinner("sending notification to GitHub...");
    spinner.start();
    return Promise.all(reqs.map(r => rp(r).catch(errorHandler(this._logger))))
      .then(() => spinner.stop())
      .catch(() => spinner.stop())
    ;
  }
}
