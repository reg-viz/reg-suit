import * as inquirer from "inquirer";

import { CliOptions } from "../cli-options";
import packageUtil, { PLUGIN_NAME_REGEXP } from "../package-util";
import getRegCore from "../get-reg-core";

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
  }, Promise.resolve([]))
  .then(pluginConfigs => core.persistMergedConfig({ pluginConfigs }, confirmUpdateConfig))
  ;
}

export default prepare;
