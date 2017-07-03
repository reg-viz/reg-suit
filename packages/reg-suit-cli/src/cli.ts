#!/usr/bin/env node

import * as path from "path";
import * as resolve from "resolve";
import * as yargs from "yargs";
import * as inquirer from "inquirer";

import {
  RegSuitCore
} from "reg-suit-core/lib/core";

import packageUtil from "./package-util";

interface PluginDescriptor {
  name: string;
  description: string;
}

const WELL_KNOWN_PLUGINS = require(path.join(__dirname, "..", "well-known-plugins.json")) as PluginDescriptor[];

interface CliOptions {
  command: string;
  configFileName?: string;
  logLevel: "verbose" | "info" | "silent";
  noEmit: boolean;
  npmClient: "npm" | "yarn";
}

function createOptions() {
  yargs
    .alias("c", "config")
    .alias("t", "test").boolean("test")
    .alias("v", "verbose").boolean("verbose")
    .alias("q", "quiet").boolean("quiet")
    .boolean("use-yarn")
    .command("run", "run all")
    .command("prepare", "prepare plugin")
  ;
  const { config, verbose, quiet, test, useYarn } = yargs.argv;
  const command = yargs.argv._[0] || "run";
  const logLevel = verbose ? "verbose" : (quiet ? "silent" : "info");
  const npmClient = useYarn ? "yarn" : "npm";
  return {
    command,
    logLevel,
    configFileName: config,
    noEmit: test,
    npmClient,
  } as CliOptions;
}

function getRegCore(options: CliOptions) {
  const localCoreModuleId = packageUtil.checkInstalledLocalCore();
  let core: RegSuitCore;
  if (localCoreModuleId) {
    const Klazz = require(path.join(localCoreModuleId, "lib/index.js"))["RegSuitCore"] as typeof RegSuitCore;
    core = new Klazz({
      logLevel: options.logLevel,
      noEmit: options.noEmit,
    });
  } else {
    core = new RegSuitCore({
      logLevel: options.logLevel,
      noEmit: options.noEmit,
    });
  }
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

function install(options: CliOptions) {
  const core = getRegCore(options);
  return inquirer.prompt([
    {
      type: "checkbox",
      name: "pluginNamesToInstall",
      message: "Plugin(s) to install",
      choices: WELL_KNOWN_PLUGINS.map(d => ({ name: ` ${d.name} : ${d.description}`, value: d.name })),
    }
  ])
  .then(({ pluginNamesToInstall }: { pluginNamesToInstall: string[] }) => pluginNamesToInstall)
  .then(pluginNamesToInstall => {
    const isCliInstalled = packageUtil.checkInstalledLocalCli();
    if (!isCliInstalled) {
      core.logger.info("This project does not have local installed reg-suit, so install it.");
    }
    if (options.noEmit) return Promise.resolve([]);
    core.logger.info("Install dependencies to the local directory. This procedure takes some minute, please wait...");
    if (!isCliInstalled) {
      return packageUtil.installPluginAndCli(options.npmClient, pluginNamesToInstall)
      .then(packages => {
        core.logger.info("Installation ended successfully.");
        core.logger.verbose(packages.join(", "));
        return packages;
      })
      ;
    } else {
      return packageUtil.installPackages(options.npmClient, pluginNamesToInstall)
      .then(packages => {
        core.logger.info("Installation ended successfully.");
        core.logger.verbose(packages.join(", "));
        return packages;
      })
      ;
    }
  })
  ;
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

  let installPromise: Promise<any>;

  return questions.reduce((acc, qh) => {
    return acc.then(configs => {
      core.logger.info(`Set up ${qh.name}:`);
      return inquirer.prompt(qh.questions).then((ans: any) => qh.prepare(ans)).then((c: any) => [...configs, { name: qh.name, config: c }])
    });
  }, Promise.resolve([]))
  .then(pluginConfigs => core.persistMergedConfig({ pluginConfigs }, confirmUpdateConfig))
  ;
}

function init(options: CliOptions) {
  return install(options).then(() => prepare(options));
}

function cli(): Promise<any> {
  const options = createOptions();
  if (options.command === "run") {
    return run(options);
  } else if(options.command === "install") {
    return install(options);
  } else if(options.command === "prepare") {
    return prepare(options);
  } else if(options.command === "init") {
    return init(options);
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
