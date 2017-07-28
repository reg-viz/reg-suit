import * as path from "path";

import {
  PreparerQuestion,
  PluginCreateOptions,
  PluginPreparer
} from "reg-suit-interface";

import { GitHubPluginOption } from "./github-notifier-plugin";

const open = require("open") as (url: string) => void;

export interface GitHubPreparerOption {
  clientId: string;
}

export class GitHubPreparer implements PluginPreparer<GitHubPreparerOption, GitHubPluginOption> {
  inquire(): PreparerQuestion[] {
    return [
      {
        type: "confirm",
        name: "openApp",
        message: "notify-github plugin requires a client ID of reg-suit GitHub app. Open installation window in your browser",
        default: true,
      },
      {
        type: "input",
        message: "This repositoriy's client ID of reg-suit GitHub app",
        name: "clientId",
        when: ({ openApp }: { openApp: boolean }) => {
          openApp && open("https://reg-viz.github.io/reg-suit/front/");
          return true;
        },
      },
    ];
  }

  prepare(option: PluginCreateOptions<GitHubPreparerOption>): Promise<GitHubPluginOption> {
    return Promise.resolve({
      clientId: option.options.clientId,
    });
  }
}
