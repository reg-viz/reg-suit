#!/usr/bin/env node
import path from "path";
import yargs from "yargs";

import { CliOptions } from "./cli-options";
import init from "./commands/init";
import install from "./commands/install";
import prepare from "./commands/prepare";
import run from "./commands/run";
import syncExpected from "./commands/sync-expected";
import compare from "./commands/compare";
import publish from "./commands/publish";
import getRegCore from "./get-reg-core";

const version = require(path.resolve(__dirname, "../package.json")).version as string;

function createOptions() {
  yargs
    .usage("Usage: $0 [options] <command>")
    .help()
    .option("h", { alias: "help", group: "Global Options:" })
    .option("c", {
      alias: "config",
      desc: "Configuration file path.",
      default: "regconfig.json",
      group: "Global Options:",
    })
    .option("t", {
      alias: "test",
      desc: "Perform a trial with no changes.",
      boolean: true,
      default: false,
      group: "Global Options:",
    })
    .option("v", {
      alias: "verbose",
      desc: "Display debug logging messages.",
      boolean: true,
      default: false,
      group: "Global Options:",
    })
    .option("q", {
      alias: "quiet",
      desc: "Suppress logging messages",
      boolean: true,
      default: false,
      group: "Global Options:",
    })
    .option("version", { desc: "Print version number.", group: "Global Options:" })
    .version(version)
    .boolean("use-dev-core") // This option is used for cli developers only, so does not need help.
    .command("init", "Install and set up reg-suit and plugins into your project.", {
      useYarn: { desc: "Whether to use yarn as npm client.", boolean: true, default: false },
      useYarnWs: { desc: "Whether to use yarn workspace.", boolean: true, default: false },
    })
    .command("prepare", "Configure installed plugin", {
      p: { alias: "plugin", array: true, desc: "Plugin name(s) you want to set up(e.g. slack-notify)." },
    })
    .command("run", "Run all procedure regression testing.")
    .command("sync-expected", "Fecth expected images into working directory.")
    .command("compare", "Compare actual images with expected images and creates report.")
    .command("publish", "Publish the latest comparison result in working directory.", {
      n: { alias: "notification", desc: "Send notifications with publishing", boolean: true, default: false },
    })
    .wrap(120)
    .locale("en");
  const { config, verbose, quiet, test, useYarn, useYarnWs, plugin, useDevCore, notification } = yargs.argv;
  const command = yargs.argv._[0];
  const logLevel = verbose ? "verbose" : quiet ? "silent" : "info";
  const npmClient = useYarn || useYarnWs ? (useYarnWs ? "yarn workspace" : "yarn") : "npm";
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
    notification,
  } as CliOptions;
}

function cli(): Promise<any> {
  const options = createOptions();
  const core = getRegCore(options);
  core.logger.info(`${core.logger.colors.magenta("version")}: ${version}`);
  if (options.command === "run" || options.command === "run-all") {
    return run(options);
  } else if (options.command === "sync-expected") {
    return syncExpected(options);
  } else if (options.command === "compare") {
    return compare(options);
  } else if (options.command === "publish") {
    return publish(options);
  } else if (options.command === "install") {
    return install(options);
  } else if (options.command === "prepare") {
    return prepare(options);
  } else if (options.command === "init") {
    return init(options);
  } else {
    yargs.showHelp();
    return Promise.resolve();
  }
}

cli()
  .then(() => process.exit(0))
  .catch((reason: any) => {
    // eslint-disable-next-line no-console
    console.error(reason);
    process.exit(1);
  });
