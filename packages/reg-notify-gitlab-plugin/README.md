# reg-notify-gitlab-plugin

reg-suit plugin to send a notification of the testing result to your GitLab repository.

Installing this plugin makes reg-suit comment to your Merge Request.

## Install

```sh
npm i reg-notify-gitlab-plugin -D
reg-suit prepare -p notify-gitlab
```

## Configure

```ts
{
  projectId: string;
  privateToken: string;
  gitlabUrl?: string;
  commentTo?: "note" | "description" | "discussion";
  shortDescription?: boolean;
}
```

- `projectId` - _Required_ - Your GitLab project id. You can get this id via `https://gitlab.com/<your-name>/<your-project-name/edit>`.
- `privateToken` - _Required_ - Your GitLab API token. If you want more detail, see [Personal access tokens doc](https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html).
- `gitlabUrl` - _Optional_ - Set if you host your GitLab instance. Default: `https://gitlab.com`
- `commentTo` - _Optional_ - How this plugin comments to MR. If `"note"`, it posts or puts the comment as an MR's note. if `"description"`, your MR's description gets updated. If `"discussion"`, it posts or puts the comment as an MR's _resolvable_ note. Default: `"note"`.
- `shortDescription` - _Optional_ Returns a small table with the item counts.
  Example:

  | 🔴 Changed | ⚪️ New | 🔵 Passing |
  | ---------- | ------- | ---------- |
  | 3          | 4       | 120        |

### Auto complete on GitLab CI

If you run reg-suit on GitLab CI, this plugin detects `gitlabUrl` and `projectId` values from [pre-declared GitLab CI environment values](https://docs.gitlab.com/ee/ci/variables/#predefined-variables-environment-variables).
So you can skip `projectId`
