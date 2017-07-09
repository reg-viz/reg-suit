import * as path from "path";

import {
  PluginCreateOptions,
  PluginPreparer
} from "reg-suit-interface";

import { fsUtil } from "reg-suit-util";

import { ConfigSection, parseGitConfig, readGitConfig } from "./git-config-parser";
import { GitHubPluginOption } from "./github-notifier-plugin";

const open = require("open") as (url: string) => void;

export interface GitHubPreparerOption {
  selectedUrl?: string;
  inputOwner?: string;
  inputRepo?: string;
  installationId: string;
}

export function extractRemoteUrls(configSectionList: ConfigSection[]) {
  return configSectionList.filter(c => c.name.startsWith("remote")).map(c => {
    return {
      name: `${c.keys["url"]} (${c.name})`,
      value: c.keys["url"],
    };
  }).filter(x => x.value.indexOf("//github.com/") !== -1)
  ;
}

export class GitHubPreparer implements PluginPreparer<GitHubPreparerOption, GitHubPluginOption> {
  inquire(): any[] {
    const prjDir = fsUtil.lookup("package.json");
    let result: any[] = [];
    const inputOwnerRepo = [
      {
        type: "input",
        name: "inputRepo",
        message: "GitHub repository name",
        default: prjDir ? path.basename(path.dirname(prjDir)) : "",
      },
      { type: "input", name: "inputOwner", message: "Repository's owner" },
    ];
    const f = readGitConfig();
    if (!f) {
      result = [...inputOwnerRepo];
    } else {
      const urlPairs = extractRemoteUrls(parseGitConfig(f));
      if (urlPairs.length) {
        result.push({
          type: "list",
          name: "selectedUrl",
          message: "Which repository do you want integrate with",
          choices: urlPairs,
        });
      } else {
        result = [...inputOwnerRepo];
      }
    }
    result.push({
      type: "input",
      name: "installationId",
      message: "Installation ID",
      when: () => {
        open("https://github.com/apps/reg/installations/new");
        return true;
      },
    });
    return result;
  }

  prepare(option: PluginCreateOptions<GitHubPreparerOption>): Promise<GitHubPluginOption> {
    if (option.options.selectedUrl) {
      const hit = option.options.selectedUrl.match(/github\.com\/([^\/]+)\/([^\/\.]+)\.git/);
      if (hit) {
        return Promise.resolve({
          installationId: option.options.installationId,
          owner: hit[1],
          repository: hit[2],
          prComment: true,
        });
      } else {
        return Promise.reject<GitHubPluginOption>(new Error("not reachable"));
      }
    } else if(option.options.inputOwner && option.options.inputRepo) {
      return Promise.resolve({
        installationId: option.options.installationId,
        owner: option.options.inputOwner,
        repository: option.options.inputRepo,
        prComment: true,
      });
    } else {
      return Promise.reject<GitHubPluginOption>(new Error("not reachable"));
    }
  }
}
