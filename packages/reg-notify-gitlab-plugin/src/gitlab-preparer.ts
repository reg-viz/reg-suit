import { PreparerQuestion, PluginCreateOptions, PluginPreparer } from "reg-suit-interface";

import { GitLabPluginOption } from "./gitlab-notifier-plugin";

export class GitLabPreparer implements PluginPreparer<undefined, GitLabPluginOption> {
  inquire(): PreparerQuestion[] {
    return [];
  }

  async prepare(option: PluginCreateOptions) {
    const { logger } = option;
    logger.info("Replace private token to actual value in reg-notify-gitlab-plugin section.");
    return {
      privateToken: "xxxxxxxxxxxxxxxx",
    } as GitLabPluginOption;
  }
}
