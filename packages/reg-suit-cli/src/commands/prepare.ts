import * as inquirer from "inquirer";

import { RegSuitCore } from "reg-suit-core";
import { CoreConfig } from "reg-suit-interface";
import { CliOptions } from "../cli-options";
import packageUtil, { PLUGIN_NAME_REGEXP } from "../package-util";
import getRegCore from "../get-reg-core";

function prepareCore(core: RegSuitCore) {
  const coreConf = core.config.core;
  const pairs: { name: keyof typeof coreConf; message: string }[] = [
    { name: "workingDir", message: "Working directory of reg-suit." },
    { name: "actualDir", message: "Directory contains actual images." },
    { name: "threshold", message: "Threshold, ranges from 0 to 1. Smaller value makes the comparison more sensitive." },
  ];
  return inquirer.prompt(pairs.map(({ name, message }) => {
    const q: inquirer.Question = {
      name, message,
      type: "input",
      default: coreConf[name] + "",
      validate: (x: string) => !!x.length,
    };
    return q;
  })).then((conf: any) => {
    // inquirer input returns string, but threshold should be type as number, so cast it.
    return { ...conf, threshold: +conf.threshold, ximgdiff: {
      invocationType: "client",
    } } as CoreConfig;
  })
  ;
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
  const confirmUpdateConfig = () => inquirer.prompt([
    {
      name: "result",
      message: "Update configuration file",
      type: "confirm",
      default: true,
    }
  ]).then(({ result } : { result: boolean }) => result);
  return (willPrepareCore ? prepareCore(core) : Promise.resolve(core.config.core)).then(coreConfig => {
    const questions = core.createQuestions({ pluginNames });
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
    }, Promise.resolve([])).then(pluginConfigs => ({ core: coreConfig, pluginConfigs }));
  })
  .then(newConf => core.persistMergedConfig(newConf, confirmUpdateConfig))
  ;
}

export default prepare;
