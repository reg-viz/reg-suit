#!/usr/bin/env node

import * as yargs from "yargs";
import * as inquirer from "inquirer";

import {
  RegSuitCore
} from "reg-suit-core/lib/core";

interface CliOptions {
  command: string;
  configFileName?: string;
  logLevel: "verbose" | "info" | "silent";
  noEmit: boolean;
}

function createOptions() {
  yargs
    .alias("c", "config")
    .alias("t", "test").boolean("test")
    .alias("v", "verbose").boolean("verbose")
    .alias("q", "quiet").boolean("quiet")
    .command("run", "run all")
    .command("prepare", "prepare plugin")
  ;
  const { config, verbose, quiet, test } = yargs.argv;
  const command = yargs.argv._[0] || "run";
  const logLevel = verbose ? "verbose" : (quiet ? "silent" : "info");
  return {
    command,
    logLevel,
    configFileName: config,
    noEmit: test,
  } as CliOptions;
}

function getRegCore(options: CliOptions) {
  const core = new RegSuitCore({
    logLevel: options.logLevel,
    noEmit: options.noEmit,
  });
  if (options.configFileName) {
    core.logger.verbose(`config file: ${options.configFileName}`);
  } else {
    core.logger.verbose(`config file: not specified.`);
  }
  return core;
}

function run(options: CliOptions) {
  const core = getRegCore(options);
  core.init(options.configFileName);
  return core.runAll();
}

function prepare(options: CliOptions) {
  const core = getRegCore(options);
  const questions = core.createQuestions({ configFileName: options.configFileName });
  const confirmUpdateConfig = () => inquirer.prompt([
    {
      name: "result",
      message: "Update configuration?",
      type: "confirm",
      default: true,
    }
  ]).then(({ result } : { result: boolean }) => result);
  return questions.reduce((acc, qh) => {
    return acc.then(configs => {
      core.logger.info(`Set up ${qh.name}:`);
      return inquirer.prompt(qh.questions).then((ans: any) => qh.prepare(ans)).then((c: any) => [...configs, { name: qh.name, config: c }])
    });
  }, Promise.resolve([]))
  .then(pluginConfigs => core.persistMergedConfig({ pluginConfigs }, confirmUpdateConfig))
  ;
}

function cli(): Promise<any> {
  const options = createOptions();
  if (options.command === "run") {
    return run(options);
  } else if(options.command === "prepare") {
    return prepare(options);
  }
  return Promise.resolve();
}

cli()
.then(() => process.exit(0))
.catch((reason: any) => {
  console.error(reason);
  process.exit(1);
})
;
