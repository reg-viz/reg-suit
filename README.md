![reg-suit](./images/reg-suit.jpg)

[![CircleCI](https://circleci.com/gh/reg-viz/reg-suit.svg?style=svg)](https://circleci.com/gh/reg-viz/reg-suit)
[![npm version](https://badge.fury.io/js/reg-suit.svg)](https://badge.fury.io/js/reg-suit)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

**reg-suit** is a command line interface for visual regression testing.

- _Compare Images_ - reg-suit is inspired by snapshot testing. It compares the current images with the previous images, creates an HTML report for their differences. All you need is to give images to assert.
- _Store Snapshots_ - reg-suit automatically stores snapshot images to external cloud storage(e.g. AWS S3, Google Cloud Storage). You can review result of comparison and differences at any time you want.
- _Work Everywhere_ - reg-suit is just a CLI. So it's easy to integrate with your project. It works at any CI services and even your local machine.

## Getting Started

```sh
$ npm install -g reg-suit
$ cd path-to-your-project
$ reg-suit init
# Answer a few questions...
```

```sh
$ reg-suit run
```

[![asciicast](https://asciinema.org/a/ueyQbqEjZujRSrag2wLig1PPu.png)](https://asciinema.org/a/ueyQbqEjZujRSrag2wLig1PPu)

If you want more details, [this sample repository](https://github.com/reg-viz/reg-puppeteer-demo) may help you.

## Plugins

reg-suit has it's own plugin system. Plugins integrate various functions and services into your project.

The following plugins are available:

- [reg-keygen-git-hash-plugin](https://github.com/reg-viz/reg-suit/tree/master/packages/reg-keygen-git-hash-plugin/README.md) - _key-generator plugin_ - This plugin provides functions to identify "what commit hash should I compare to" walking git branch graph.
- [reg-simple-keygen-plugin](https://github.com/reg-viz/reg-suit/tree/master/packages/reg-simple-keygen-plugin/README.md) - _key-generator plugin_ - This plugin allows to use arbitrary string as the snapshot key.
- [reg-publish-s3-plugin](https://github.com/reg-viz/reg-suit/tree/master/packages/reg-publish-s3-plugin/README.md) - _publisher plugin_ - This plugin fetches the previous snapshot images from S3 bucket and these fetched snapshots are used as expected images in comparison. After the comparison, this plugin pushes the current(the actual) snapshot images and the report of the comparison result.
- [reg-publish-gcs-plugin](https://github.com/reg-viz/reg-suit/tree/master/packages/reg-publish-gcs-plugin/README.md) - _publisher plugin_ - An alternative publisher plugin. It's so similar to S3 plugin but this uses Google Cloud Storage instead of S3.
- [reg-notify-github-plugin](https://github.com/reg-viz/reg-suit/tree/master/packages/reg-notify-github-plugin/README.md) - _notifier plugin_ - This plugin integrates reg-suit and it's [GitHub app](https://github.com/apps/reg-suit). Installing these plugin and app, you can receive reg-suit result via GitHub commit status and PR comment.
- [reg-notify-gitlab-plugin](https://github.com/reg-viz/reg-suit/tree/master/packages/reg-notify-gitlab-plugin/README.md) - _notifier plugin_ - This plugin notifies reg-suit result to your GitLab projects' merge requests comment.
- [reg-notify-github-with-api-plugin](https://github.com/reg-viz/reg-suit/tree/master/packages/reg-notify-github-with-api-plugin/README.md) - _notifier plugin_ - This plugin notifies reg-suit result to your GHE repositories PR comment.
- [reg-notify-slack-plugin](https://github.com/reg-viz/reg-suit/tree/master/packages/reg-notify-slack-plugin/README.md) - _notifier plugin_ - This plugin notifies reg-suit result to your Slack channel using incoming Webhook.
- [reg-notify-chatwork-plugin](https://github.com/reg-viz/reg-suit/tree/master/packages/reg-notify-chatwork-plugin/README.md) - _notifier plugin_ - This plugin notifies reg-suit result to your Chatwork channel use [Chatwork API Token](https://www.chatwork.com/service/packages/chatwork/subpackages/api/token.php).

For example, installing keygen-git-hash and publish-s3 plugins, you can get regression testing workflow according with GitHub flow as shown in the figure below.

![GitHub workflow](https://raw.githubusercontent.com/Quramy/reg-suit/master/images/github_flow.png)

## CLI Usage

```sh
reg-suit [options] <command>
```

### `run` command

Run visual testing, publish the current snapshot images, and send notifications. It's equivalent to `reg-suit sync-expected && reg-suit compare && reg-suit publish -n`.

#### `sync-expected` command

Fetch images published already as the expected snapshot data into working directory. The expected key is detected with the installed _key-generator plugin_, and installed `publisher-plugin` fetches images data.

#### `compare` command

Compare images in the `actualDir` with images fetched at `sync-expected` and create an HTML report.

#### `publish` command

Publish the `compare` result and actual images to external storage with _publisher-plugin_ with the actual snapshot key generated by installed _key-generator plugin_.

- `-n`, `--notification` : Send notification using installed _notifier plugins_.

### `init` command

Install and configure reg-suit and plugins into your project.

- `--use-yarn` : By the default cli installs packages using `npm`. If you prefer yarn pkg, turn this option on.
- `--use-yarn-ws` : If you use yarn workspace, turn this option on.

### `prepare` command

Configure the installed plugin(s). It's useful to configure reg-suit and plugins.

- `-p`, `--plugin` : Specify plugin name(s) to be configured.

### Global options

- `-c`, `--config` : Configuration file path.
- `-t`, `--test` : Perform a trial with no changes(Dry-run mode).
- `-v`, `--verbose` : Display debug logging messages.
- `-q`, `--quiet` : Suppress logging messages.

If you want more details, please exec `reg-suit -h` or `reg-suit <command> -h`.

## Configuration

To configure reg-suit, put `regconfig.json` under the project root directory. `regconfig.json` should be JSON file such as:

```json
{
  "core": {
    "workingDir": ".reg",
    "actualDir": "images",
    "thresholdRate": 0.05
  },
  "plugins": {
    "reg-keygen-git-hash-plugin": {},
    "reg-publish-s3-plugin": {
      "bucketName": "your-aws-s3-bucket"
    }
  }
}
```

The `core` section contains reg-suit core setting and the `plugins` section contains plugin specific options.

### `core`

```ts
{
  actualDir: string;
  workingDir?: string;        // default ".reg"
  thresholdRate?: number;    // default 0
  thresholdPixel?: number;    // default 0
  enableAntialias?: boolean;    // default false
  ximgdiff?: {
    invocationType: "none" | "client";  // default "client"
  };
}
```

- `actualDir` - _Required_ - A directory which contains image files you want to test.
- `workingDir` - _Optional_ - A directory used by reg-suit puts temporary files. Ordinarily this dir is in listed at `.gitignore`.
- `thresholdRate` - _Optional_ - Threshold of the ratio of the number of pixels where the difference occurred to the whole. It should be in ranges from `0` to `1`.
- `thresholdPixel` - _Optional_ - Alternative threshold. The absolute number of pixels where difference occurred.
- `matchingThreshold` - _Optional_ - Matching threshold for YUV color distance between two pixels. It should be in ranges from 0 to 1. Smaller values make the comparison more sensitive.
- `enableAntialias` - _Optional_ - Enable antialias, so that anti-aliased pixels are detected and ignored when comparing images.
- `ximgdiff` - _Optional_ - An option to display more detailed difference information to report html.
- `ximgdiff.invocationType` - If set `"client"`, x-img-diff-js be invoked only with browsers. See [smart differences detection](#smart-difference-detection) section.

### `plugins`

Entries of `plugins` section are described as key-value pairs. Each key should be plugin name. If you want configurable value, see README.md under the each plugin package(e.g. [packages/reg-publish-s3-plugin/README.md](https://github.com/reg-viz/reg-suit/tree/master/packages/reg-publish-s3-plugin/README.md)).

#### Embed environment values

reg-suit replaces embedded placeholders in `plugins` section to environment values at runtime. For example:

```json
  "plugins": {
    "reg-publish-s3-plugin": {
      "bucketName": "$S3_BUCKET_NAME"
    }
  }
```

```sh
export S3_BUCKET_NAME="my-bucket"
reg-suit run

# reg-publish-s3-plugin is configured with the following value:
#
# {
#   "bucketName": "my-bucket"
# }
```

### Smart difference detection

If you turn `core.ximgdiff` option on in `regconfig.json`, reg-suit outputs a report with x-img-diff-js.

[x-img-diff-js](https://reg-viz.github.io/x-img-diff-js) is a difference detection engine which calculates more structural information than naive pixel based comparison result.
reg-suit use this to display which parts of testing image were inserted or moved.

If `invocationType` is set to `"client"`, x-img-diff-js works on your web browser (It uses Web Assembly and Web Workers, so you need "modern" browser).

## Run with CI service

A working demonstration is [here](https://github.com/reg-viz/reg-simple-demo).

### _Workaround for Detached HEAD_

reg-suit(git-hash-plugin) needs the current branch name to identify the base-commit hash. However, under some CI services' environment(e.g. TravisCI, WerckerCI), the HEAD is detached. So you should attach it explicitly.

For example:

```yml
# .github/workflows/reg.yml

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
        with:
          fetch-depth: 0
      - name: Use Node.js v10
        uses: actions/setup-node@v1
        with:
          node-version: "10.x"
      - name: npm install, build, and test
        run: |
          npm i
      - name: workaround for detached HEAD
        run: |
          git checkout ${GITHUB_REF#refs/heads/} || git checkout -b ${GITHUB_REF#refs/heads/} && git pull
      - name: run reg-suit
        run: |
          npx reg-suit run
```

```yml
# .travis.yml

script:
  - git config remote.origin.fetch "+refs/heads/*:refs/remotes/origin/*" # This line is necessary to disable --single-branch option to fetch all remote branches on TravisCI.
  - git fetch origin # Ditto
  - git checkout $TRAVIS_BRANCH || git checkout -b $TRAVIS_BRANCH
  - npx reg-suit run
```

```yml
# wercker.yml

build:
  steps:
    - script:
      name: Attach HEAD
      code: |
        git checkout $WERCKER_GIT_BRANCH || git checkout -b $WERCKER_GIT_BRANCH
    - script:
      name: Run reg-suit
      code: |
        npx reg-suit run
```

```yml
# appveyor.yml

environment:
  nodejs_version: "8"

install:
  - ps: Install-Product node $env:nodejs_version
  - git checkout %APPVEYOR_REPO_BRANCH%

test_script:
  - npx reg-suit run
```

```yml
# .gitlab-ci.yml

test:
  script:
    - git checkout $CI_COMMIT_REF_NAME || git checkout -b $CI_COMMIT_REF_NAME && git pull
    - npx reg-suit run
```

## Examples

The following repositories using reg-suit. These repos can help you to introduce visual snapshot testing.

- [reg-viz/reg-simple-demo](https://github.com/reg-viz/reg-simple-demo): Simple image files project includes various CI services' script.
- [reg-viz/reg-puppeteer-demo](https://github.com/reg-viz/reg-puppeteer-demo): Simple HTML project using Puppeteer for capturing screenshot.
- [bokuweb/react-avaron-reg-sample](https://github.com/bokuweb/react-avaron-reg-sample): React project using avaron(= Ava + Electron) for capturing screenshot.
- [quramy/angular-puppeteer-demo](https://github.com/Quramy/angular-puppeteer-demo): Angular project using Puppeteer for capturing screenshot.
- [tadashi-aikawa/owlora](https://github.com/tadashi-aikawa/owlora): React project using storybook and Puppeteer for capturing screenshot.
- [tsuchikazu/vue-reg-suit-demo](https://github.com/tsuchikazu/vue-reg-suit-demo): Vue.js project using karma-nightmare for capturing screenshot.
- [reg-viz/preview-sketch-demo](https://github.com/reg-viz/preview-sketch-demo): Sketch file project. reg-suit compares their preview images.
- [quramy/angular-sss-demo](https://github.com/Quramy/angular-sss-demo): Angular project using Storybook and storybook-chrome-screenshot.
- [tsuyoshiwada/scs-with-reg-viz](https://github.com/tsuyoshiwada/scs-with-reg-viz): React project using Storybook and storybook-chrome-screenshot.

If you use reg-suit, let us know your repository. We'll list it at the above :)

## Contribute

PRs are welcome!

### Bootstrap

```sh
git clone https://github.com/reg-viz/reg-suit.git; cd reg-suit
yarn
yarn run bootstrap
```

### Test

```sh
yarn run test
```

_Remarks_

- `reg-publish-s3-plugin` testing access to AWS S3 and it needs AWS credentials.
- `reg-publish-gcs-plugin` testing access to Google Cloud Platform. You should `gcloud auth application-default login` before testing it.

## License

MIT. See LICENSE.txt.

![reg-viz](https://raw.githubusercontent.com/reg-viz/artwork/master/repository/footer.png)
