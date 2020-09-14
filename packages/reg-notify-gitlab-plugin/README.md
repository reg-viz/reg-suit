# reg-notify-gitlab-plugin

reg-suit plugin to send notification the testing result to your GitLab repository.

Installing this plugin, reg-suit comments to your Merge Request.

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
}
```

- `projectId` - _Required_ - Your GitLab project id. You can get this id via `https://gitlab.com/<your-name>/<your-project-name/edit>` page.
- `privateToken` - _Required_ - Your GitLab API token. If you want more detail, see [Personal access tokens doc](https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html).
- `gitlabUrl` - _Optional_ - Set if you host your GitLab instance. Default: `https://gitlab.com`
- `commentTo` - _Optional_ - How this plugin comments to MR. If `"note"`, it posts or puts the comment as a MR's note. if `"description"`, your MR's description gets updated. If `"discussion"`, it posts or puts the comment as a MR's _resolvable_ note. Default: `"note"`.

### Auto complete on GitLab CI

If you run reg-suit on GitLab CI, this plugin detect `gitlabUrl` and `projectId` values from [pre-declared GitLab CI environment values](https://docs.gitlab.com/ee/ci/variables/#predefined-variables-environment-variables).
So you can skip `projectId`
