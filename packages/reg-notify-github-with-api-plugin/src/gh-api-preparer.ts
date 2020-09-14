import { PreparerQuestion, PluginCreateOptions, PluginPreparer } from "reg-suit-interface";
import { GhApiPluginOption } from "./gh-api-notifier-plugin";

export interface GhApiPreparerOption {
  ghHostname: string;
  owner: string;
  repository: string;
  token: string;
}

export class GhApiPreparer implements PluginPreparer<GhApiPreparerOption, GhApiPluginOption> {
  inquire(): PreparerQuestion[] {
    return [
      {
        name: "ghHostname",
        type: "input",
        message: "GitHub hostname. Input if you use GitHub enterprise.",
        default: "github.com",
      },
      {
        name: "owner",
        type: "input",
        message: "Owner name.",
      },
      {
        name: "repository",
        type: "input",
        message: "Repository name.",
      },
      {
        name: "token",
        type: "input",
        message: "Private access token.",
      },
    ];
  }

  async prepare({ options: { ghHostname, owner, repository, token } }: PluginCreateOptions<GhApiPreparerOption>) {
    return {
      githubUrl: `https://${ghHostname}`,
      owner,
      repository,
      privateToken: token,
    } as GhApiPluginOption;
  }
}
