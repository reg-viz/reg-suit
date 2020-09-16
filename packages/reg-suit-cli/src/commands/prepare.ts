import path from "path";
import fs from "fs";
import inquirer from "inquirer";
import ignore from "ignore";

import { CoreConfig } from "reg-suit-interface";
import { CliOptions } from "../cli-options";
import packageUtil, { PLUGIN_NAME_REGEXP } from "../package-util";
import getRegCore from "../get-reg-core";

function hasGitignore(dir: string) {
  return fs.existsSync(path.resolve(dir, ".gitignore"));
}

function loadGitignore(dir: string) {
  const gi = fs.readFileSync(path.resolve(dir, ".gitignore"), "utf8");
  const ig = ignore();
  gi.split("\n").forEach(l => {
    if (!l.trim().startsWith("#")) {
      ig.add(l);
    }
  });
  return ig;
}

function appendGitignore(dir: string, name: string) {
  fs.appendFileSync(path.resolve(dir, ".gitignore"), name + "\n", "utf-8");
}

export function prepareCore(coreConf: CoreConfig, confDir: string) {
  return inquirer
    .prompt([
      {
        name: "workingDir",
        message: "Working directory of reg-suit.",
        default: coreConf.workingDir,
        validate(x: string) {
          return !!x.length;
        },
      },
      {
        name: "addIgnore",
        type: "confirm",
        message: function ({ workingDir }: { [key: string]: string }) {
          return `Append "${workingDir}" entry to your .gitignore file.`;
        },
        when({ workingDir }: { [key: string]: string }) {
          return hasGitignore(confDir) && !loadGitignore(confDir).ignores(workingDir);
        },
        default: true,
      },
      {
        name: "actualDir",
        message: "Directory contains actual images.",
        default: coreConf.actualDir,
        validate(x: string) {
          return !!x.length;
        },
      },
      {
        name: "thresholdRate",
        message: "Threshold, ranges from 0 to 1. Smaller value makes the comparison more sensitive.",
        default: coreConf.thresholdRate || coreConf.threshold || "0",
        validate(x: string) {
          return !!x.length;
        },
      },
    ])
    .then((conf: any) => {
      if (conf.addIgnore) {
        appendGitignore(confDir, conf.workingDir);
      }
      return {
        ...conf,
        thresholdRate: +conf.thresholdRate,
        ximgdiff: {
          invocationType: "client",
        },
      } as CoreConfig;
    });
}

function prepare(options: CliOptions, willPrepareCore = false) {
  willPrepareCore = willPrepareCore && !options.plugins.length;
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
  const confirmUpdateConfig = () =>
    inquirer
      .prompt([
        {
          name: "result",
          message: "Update configuration file",
          type: "confirm",
          default: true,
        },
      ])
      .then(({ result }: { [key: string]: boolean }) => result);
  return (willPrepareCore
    ? prepareCore(core.config.core, core.getDirectoryInfo().prjDir)
    : Promise.resolve(core.config.core)
  )
    .then(coreConfig => {
      const questions = core.createQuestions({ pluginNames });
      return questions
        .reduce((acc: Promise<{ name: string; config: any }[]>, qh) => {
          return acc.then(configs => {
            if (qh.questions.length) {
              core.logger.info(`Set up ${qh.name}:`);
            }
            const additionalQuestion = !!qh.configured
              ? () =>
                  inquirer.prompt([
                    {
                      name: "override",
                      type: "confirm",
                      message: `${qh.name} has been already configured. Override this configuration`,
                      default: false,
                    },
                  ]) as Promise<{ override: boolean }>
              : () => Promise.resolve({ override: true });
            return additionalQuestion()
              .then(({ override }) => {
                if (override) {
                  return inquirer.prompt(qh.questions).then((ans: any) => qh.prepare(ans));
                } else {
                  return Promise.resolve<any>(qh.configured);
                }
              })
              .then((c: any) => [...configs, { name: qh.name, config: c }]);
          });
        }, Promise.resolve([]))
        .then((pluginConfigs: any) => ({ core: coreConfig, pluginConfigs }));
    })
    .then(newConf => core.persistMergedConfig(newConf, confirmUpdateConfig));
}

export default prepare;
