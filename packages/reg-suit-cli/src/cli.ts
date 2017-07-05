#!/usr/bin/env node

import * as path from "path";
import * as resolve from "resolve";
import * as yargs from "yargs";
import * as inquirer from "inquirer";

import { RegSuitCore } from "reg-suit-core";

import packageUtil, { PLUGIN_NAME_REGEXP } from "./package-util";

interface PluginDescriptor {
  name: string;
  description: string;
}

type CpFile = (from: string, to: string) => Promise<void>;
const cpFile = require("cp-file") as CpFile;

const WELL_KNOWN_PLUGINS = require(path.join(__dirname, "..", "well-known-plugins.json")) as PluginDescriptor[];

interface CliOptions {
  command: string;
  configFileName?: string;
  logLevel: "verbose" | "info" | "silent";
  noEmit: boolean;
  npmClient: "npm" | "yarn";
  plugins: string[];
  noInstallCore: boolean;
}

function createOptions() {
  yargs
    .alias("c", "config")
    .alias("t", "test").boolean("test")
    .alias("v", "verbose").boolean("verbose")
    .alias("q", "quiet").boolean("quiet")
    .boolean("use-dev-core")
    .boolean("use-yarn")
    .command("run", "run all")
    .command("prepare", "prepare plugin", {
      plugin: {
        alias: "p",
        array: true,
      },
    })
  ;
  const { config, verbose, quiet, test, useYarn, plugin, useDevCore } = yargs.argv;
  const command = yargs.argv._[0] || "run";
  const logLevel = verbose ? "verbose" : (quiet ? "silent" : "info");
  const npmClient = useYarn ? "yarn" : "npm";
  const plugins = (plugin || []) as string[];
  const noInstallCore = !!useDevCore;
  return {
    command,
    logLevel,
    configFileName: config,
    noEmit: test,
    npmClient,
    plugins,
    noInstallCore,
  } as CliOptions;
}

let _coreInstanceForCache: RegSuitCore;
function getRegCore(options: CliOptions, ignoreCache = false) {
  const localCoreModuleId = options.noInstallCore ? null : packageUtil.checkInstalledLocalCore();
  let core: RegSuitCore;
  if (!ignoreCache && _coreInstanceForCache) {
    return _coreInstanceForCache;
  }
  if (localCoreModuleId) {
    // use local installed reg-suit-core if user project has it.
    const CoreFactory = require(localCoreModuleId)["RegSuitCore"] as typeof RegSuitCore;
    core = new CoreFactory({
      logLevel: options.logLevel,
      noEmit: options.noEmit,
    });
  } else {
    core = new RegSuitCore({
      logLevel: options.logLevel,
      noEmit: options.noEmit,
    });
  }
  _coreInstanceForCache = core;
  return _coreInstanceForCache;
}

function init(options: CliOptions) {
  return install(options).then(() => prepare(options)).then(() => {
    return inquirer.prompt([
      {
        name: "copyFromSample",
        message: "Copy sample images to working dir",
        type: "confirm",
        default: true,
      },
    ]).then(({ copyFromSample }: { copyFromSample: boolean }) => {
      const core = getRegCore(options);
      const { actualDir } = core.getDirectoryInfo(options.configFileName);
      core.logger.info("Initialization ended successfully \u2728");
      if (copyFromSample) {
        const fromDir = packageUtil.checkInstalled("reg-cli");
        if (fromDir) {
          const fromPath = path.join(fromDir, "report", "sample", "actual", "sample.jpg");
          const toPath = path.join(actualDir, "sample.jpg");
          return cpFile(fromPath, toPath).then(() => {
            core.logger.verbose(`Copied file from ${fromPath} to ${toPath}.`);
            core.logger.info("Execute 'reg-suit' \u2B50");
          });
        }
      } else {
        core.logger.info(`Put your images files into ${actualDir}.`);
      }
    });
  });
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
  const core = getRegCore(options, true);
  const installedPluginNames = packageUtil.getInstalledPlugins();
  let pluginNames: string[] = [];
  if (options.plugins.length) {
    options.plugins.forEach(name => {
      const pluginName = PLUGIN_NAME_REGEXP.test(name) ? name : `reg-${name}-plugin`;
      if (!installedPluginNames.some(p => p === pluginName)) {
        core.logger.warn(`Plugin '${pluginName}' is not installed. Please exec 'npm install ${pluginName}' .`);
      } else {
        pluginNames.push(pluginName);
      }
    });
  } else {
    pluginNames = installedPluginNames;
  }
  const confirmUpdateConfig = () => inquirer.prompt([
    {
      name: "result",
      message: "Update configuration file",
      type: "confirm",
      default: true,
    }
  ]).then(({ result } : { result: boolean }) => result);
  const questions = core.createQuestions({ configFileName: options.configFileName, pluginNames });
  return questions.reduce((acc, qh) => {
    return acc.then(configs => {
      if (qh.questions.length) {
        core.logger.info(`Set up ${qh.name}:`);
      }
      const additionalQuestion = !!qh.configured ? () => inquirer.prompt([{
        name: "override",
        type: "confirm",
        message: `${qh.name} has been already configured. Override this configuration`,
        default: false,
      }]) as Promise<{ override: boolean }> : () => Promise.resolve({ override: true });
      return additionalQuestion()
        .then(({ override }) => {
          if (override) {
            return inquirer.prompt(qh.questions).then((ans: any) => qh.prepare(ans));
          } else {
            return Promise.resolve<any>(qh.configured);
          }
        })
        .then((c: any) => [...configs, { name: qh.name, config: c }])
      ;
    });
  }, Promise.resolve([]))
  .then(pluginConfigs => core.persistMergedConfig({ pluginConfigs }, confirmUpdateConfig))
  ;
}

function run(options: CliOptions) {
  const core = getRegCore(options);
  core.init(options.configFileName);
  return core.runAll();
}

function cli(): Promise<any> {
  const options = createOptions();
  const core = getRegCore(options);
  const version = require(path.resolve(__dirname, "../package.json")).version as string;
  core.logger.info(`${core.logger.colors.magenta("version")}: ${version}`);
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
  // tslint:disable-next-line:no-console
  console.error(reason);
  process.exit(1);
})
;
