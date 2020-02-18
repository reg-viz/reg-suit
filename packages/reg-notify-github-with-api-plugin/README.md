# reg-notify-github-with-api-plugin

reg-suit plugin to send notification the testing result to your GitHub repository.

**It's similar to [reg-notify-github-plugin](https://www.npmjs.com/package/reg-notify-github-plugin). While reg-notify-github-plugin uses GitHub App, this plugin uses GitHub API with personal access token.
We create this plugin for GitHub Enterprise user. reg-notify-github-plugin is strongly recommended if you use `github.com`.**

## Install

```sh
npm i reg-notify-github-with-api-plugin -D
reg-suit prepare -p notify-github-with-api
```

## Configure

```ts
{
  githubUrl?: sring;
  owner: string;
  repository: string;
  privateToken: string;
}
```

- `githubUrl` - *Optional* - URL for your GitHub Enterprise. Default: `https://github.com`.
- `owner` - *Required* - GitHub owner name.
- `repository` - *Required* - GitHub repository name.
- `privateToken` - *Required* Private access token. The `repo` scope is required if the repository is private.
