import { NotifierPlugin, NotifyParams, PluginCreateOptions, PluginLogger } from "reg-suit-interface";
import { parse } from "url";
import { commentToMergeRequests, appendOrUpdateMergerequestsBody, addDiscussionToMergeRequests } from "./use-cases";
import { DefaultGitLabApiClient } from "./gitlab-api-client";

export interface GitLabPluginOption {
  gitlabUrl?: string;
  projectId?: string;
  privateToken: string;
  commentTo?: "note" | "description" | "discussion";
}

export class GitLabNotifierPlugin implements NotifierPlugin<GitLabPluginOption> {
  naem = "reg-notify-gitlab-plugin";

  private _noEmit!: boolean;
  private _logger!: PluginLogger;
  private _gitlabUrl!: string;
  private _projectId!: string | undefined;
  private _token!: string | undefined;
  private _commentTo: "note" | "description" | "discussion" = "note";

  init(config: PluginCreateOptions<GitLabPluginOption>) {
    this._noEmit = config.noEmit;
    this._logger = config.logger;
    this._token = config.options.privateToken;
    this._commentTo = config.options.commentTo || "note";

    const ciProjectUrl = process.env["CI_PROJECT_URL"];
    if (ciProjectUrl && !config.options.gitlabUrl) {
      const parsedUrl = parse(ciProjectUrl);
      const gurl = parsedUrl.protocol + "//" + parsedUrl.host;
      this._logger.info("GitLab url" + this._logger.colors.cyan(gurl) + " is detected.");
      this._gitlabUrl = gurl;
    } else {
      this._gitlabUrl = config.options.gitlabUrl || "https://gitlab.com";
    }

    const ciProjectId = process.env["CI_PROJECT_ID"];
    if (ciProjectId && !config.options.projectId) {
      this._logger.info("Project ID " + this._logger.colors.cyan(ciProjectId) + " is detected.");
      this._projectId = ciProjectId;
    } else if (config.options.projectId) {
      this._projectId = config.options.projectId;
    }
  }

  async notify(params: NotifyParams) {
    if (!this._projectId) {
      this._logger.warn("GitLab project id is needed. Check plugins config.");
      return;
    }
    if (!this._token) {
      this._logger.warn("GitLab private access token is needed. Check plugins config.");
      return;
    }
    const client = new DefaultGitLabApiClient(this._gitlabUrl, this._token);
    if (this._commentTo === "description") {
      await appendOrUpdateMergerequestsBody({
        noEmit: this._noEmit,
        logger: this._logger,
        client,
        notifyParams: params,
        projectId: this._projectId,
      });
    } else if (this._commentTo === "discussion") {
      await addDiscussionToMergeRequests({
        noEmit: this._noEmit,
        logger: this._logger,
        client,
        notifyParams: params,
        projectId: this._projectId,
      });
    } else {
      await commentToMergeRequests({
        noEmit: this._noEmit,
        logger: this._logger,
        client,
        notifyParams: params,
        projectId: this._projectId,
      });
    }
  }
}
