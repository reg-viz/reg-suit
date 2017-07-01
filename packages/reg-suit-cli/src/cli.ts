#!node

import * as yargs from "yargs";
import * as inquirer from "inquirer";

import {
  RegSuitCore
} from "reg-suit-core/lib/core";

interface CliOptions {
  command: string;
  configFileName?: string;
}

function createOptions() {
  yargs
    .alias("c", "config")
    .alias("v", "verbose")
    .command("run", "run all")
    .command("prepare", "prepare plugin")
  ;
  const config = yargs.argv["config"];
  const command = yargs.argv._[0] || "run";
  return {
    command,
    configFileName: config,
  } as CliOptions;
}

function run(options: CliOptions) {
  const core = new RegSuitCore();
  core.init(options.configFileName);
  core.runAll();
}

function prepare(configFileName?: string) {
  const core = new RegSuitCore();
  const questions = core.createQuestions({ configFileName });
  questions.reduce((acc, qh) => {
    return acc.then(configs => {
      return inquirer.prompt(qh.questions).then((ans: any) => qh.prepare(ans)).then((c: any) => [...configs, { name: qh.name, config: c }])
    });
  }, Promise.resolve([]))
  .then(pluginConfigs => core.persistMergedConfig({ pluginConfigs }))
  ;
}

function cli() {
  const options = createOptions();
  if (options.command === "run") {
    run(options);
  } else if(options.command === "prepare") {
    prepare(options.configFileName);
  }
}

cli();
