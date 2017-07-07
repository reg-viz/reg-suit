import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { CommentToPrBody, UpdateStatusBody } from "reg-gh-app-interface";
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
  installationId: string;
  owner: string;
  repository: string;
  prComment: boolean;
  customEndpoint?: string;
}

const defaultEndpoint = require("../.endpoint.json").endpoint as string;

export class GitHubNotifierPlugin implements NotifierPlugin<GitHubPluginOption> {

  _logger: PluginLogger;
  _noEmit: boolean;
  _installationId: string;
  _repository: string;
  _owner: string;
  _prComment: boolean;

  _apiPrefix: string;
  _commitExplorer: CommitExplorer;

  init(config: PluginCreateOptions<GitHubPluginOption>) {
    this._noEmit = config.noEmit;
    this._logger = config.logger;
    this._installationId = config.options.installationId;
    this._owner = config.options.owner;
    this._repository = config.options.repository;
    this._prComment = config.options.prComment;
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
    const description = state === "success" ? "Passed reggression testing" : "Failed reggression testing";

    const updateStatusBody: UpdateStatusBody = {
      installationId: this._installationId,
      owner: this._owner,
      repository: this._repository,
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
    this._logger.verbose("update-status: ", statusReq);
    const reqs = [statusReq];

    if (this._prComment) {
      const prCommentBody: CommentToPrBody = {
        installationId: this._installationId,
        owner: this._owner,
        repository: this._repository,
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
      this._logger.verbose("PR comment: ", commentReq);
      reqs.push(commentReq);
    }
    if (this._noEmit) {
      return Promise.resolve();
    }
    return Promise.all(reqs.map(r => rp(r)));
  }
}
