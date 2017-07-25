# ![reg-suit](https://raw.githubusercontent.com/Quramy/reg-suit/master/logo/regsuitlogo.png)
[![CircleCI](https://circleci.com/gh/reg-viz/reg-suit.svg?style=svg)](https://circleci.com/gh/reg-viz/reg-suit)
[![npm version](https://badge.fury.io/js/reg-suit.svg)](https://badge.fury.io/js/reg-suit)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

**reg-suit** is a command line interface for visual regression testing.
- *Compare Images* - reg-suit is inspired by snapshot testing. It compares the current images with the previous images, creates an HTML report for their differences. All you need is to give images to assert.
- *Store Snapshots* - reg-suit automatically stores snapshot images to external cloud storage(e.g. AWS S3). You can review result of comparison and differences at any time you want.
- *Work Everywhere* - reg-suit is a just CLI. So it's easy to integrate with your project. It works at any CI services and even your local machine.

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

## Plugins
reg-suit has it's own plugin system. Plugins integrate your project with various services.

The following plugins are available:

- [reg-keygen-git-hash-plugin](https://github.com/reg-viz/reg-suit/tree/master/packages/reg-keygen-git-hash-plugin) - *key-generator plugin* - This plugin provides functions to identify "what commit hash should I compare to" walking git branch graph.
- [reg-publish-s3-plugin](https://github.com/reg-viz/reg-suit/tree/master/packages/reg-publish-s3-plugin) - *publisher plugin* - This plugin fetches the previous snapshot images from S3 bucket and these fetched snapshots are used as expected images in comparison. After the comparison, this plugin pushes the current(the actual) snapshot images and the report of the comparison result.
- [reg-notify-github-plugin](https://github.com/reg-viz/reg-suit/tree/master/packages/reg-notify-github-plugin) - *notifier plugin* - This plugin integrates reg-suit and it's [GitHub app](https://github.com/apps/reg-suit). Installing these plugin and app, you can receive reg-suit result via GitHub commit status and PR comment.
- [reg-notify-slack-plugin](https://github.com/reg-viz/reg-suit/tree/master/packages/reg-notify-slack-plugin) - *notifier plugin* - This plugin notifies reg-suit result to your Slack channel using incoming Webhook.

For example, installing keygen-git-hash and publish-s3 plugins, you can get regression testing workflow according with GitHub flow as shown in the figure below.

![GitHub workflow](https://raw.githubusercontent.com/Quramy/reg-suit/master/images/github_flow.png)

## CLI Usage

```sh
reg-suit [options] <command>
```

### `run` command

Run visual testing, publish the current snapshot images, and send notifications.

### `init` command

Install and configure reg-suit and plugins into your project.

- `--use-yarn` : By the default cli installs packages using `npm`. If you prefer yarn pkg, turn this option on.

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
    "threshold": 0.05
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
  workingDir?: string;    // default ".reg"
  threshold?: number;     // default 0
}
```

- `actualDir` - *Required* - A directory which contains image files you want to test.
- `workingDir` - *Optional* - A directory used by reg-suit puts temporary files. Ordinarily this dir is in listed at `.gitignore`.
- `threshold` - *Optional* - Pixel matching threshold. It should be in ranges from `0` to `1`.

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

## Run with CI service
A working demonstration is [here](https://github.com/reg-viz/reg-simple-demo).

### *Workaround for Detached HEAD*

reg-suit(git-hash-plugin) needs the current branch name to identify the base-commit hash. However, under some CI services' environment(e.g. TravisCI, WerckerCI), the HEAD is detached. So you should attach it explicitly. 

For example:

```yml
# .travis.yml 

script:
  - git checkout $TRAVIS_BRANCH || git checkout -b $TRAVIS_BRANCH
  - reg-suit run
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
        reg-suit run
```

## How it works

reg-suit calls installed plugins according to the following procedure:

* Determine the key of snapshot which will be used as the expected images via installed key-generator plugin. This step will be skipped if key-generator plugin is not set.
* Fetch the previous snapshot images as the expected snapshot via installed publisher plugin. This step will be skipped if publisher plugin is not set.
* Compare images using [reg-cli](https://github.com/reg-viz/reg-cli) and create report.
* Determine the key of the current snapshot via installed key-generator plugin. If key-Generator is not set, time stamp is used.
* Publish the current snapshot and report via installed publisher-plugin. This step will be skipped if publisher plugin is not set.
* Notify result via installed notifier-plugin.


## License
MIT. See LICENSE.txt.
