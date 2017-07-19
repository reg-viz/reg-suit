import * as fs from "fs";
import * as path from "path";
import {
  Plugin,
  CoreConfig,
  CreateQuestionsOptions,
  RegSuitConfiguration,
} from "reg-suit-interface";
import { createLogger, RegLogger, LogLevel, fsUtil } from "reg-suit-util";

import { ConfigManager } from "./config-manager";
import { PluginManager } from "./plugin-manager";
import { RegProcessor } from "./processor";

export class RegSuitCore {

  noEmit: boolean;
  logger: RegLogger;
  _pluginManager: PluginManager;
  _configFileName?: string;
  _configManager: ConfigManager;

  constructor(opt: {
    logLevel?: LogLevel;
    noEmit?: boolean;
    configFileName?: string;
  } = { }) {
    this.logger = createLogger();
    if (opt.logLevel) {
      this.logger.setLevel(opt.logLevel);
    }
    this.noEmit = !!(opt.noEmit);
    this._configFileName = opt.configFileName;
  }

  /**
   * @internal
   **/
  get _config() {
    return this._configManager.config;
  }

  createQuestions(opt: CreateQuestionsOptions) {
    this._configManager = new ConfigManager({ logger: this.logger, noEmit: this.noEmit });
    this._pluginManager = new PluginManager(this.logger, this.noEmit, this._config, this._getWorkingDirs());
    return this._pluginManager.createQuestions(opt);
  }

  persistMergedConfig(opt: { core?: CoreConfig; pluginConfigs: { name: string; config: any }[] }, confirm: (newConfig: RegSuitConfiguration) => Promise<boolean>) {
    const baseConfig = this._config;
    const mergedConfig = {
      core: opt.core ? { ...baseConfig.core, ...opt.core } : baseConfig.core,
      plugins: { ...baseConfig.plugins },
    };
    opt.pluginConfigs.forEach(pc => {
      mergedConfig.plugins[pc.name] = baseConfig.plugins ? {
        ...baseConfig.plugins[pc.name],
        ...pc.config,
      } : pc.config;
    });
    this.logger.info("Configuration:");
    this.logger.info(JSON.stringify(mergedConfig, null, 2));
    if (JSON.stringify(baseConfig) === JSON.stringify(mergedConfig)) {
      // If there is no difference, exit quietly.
      return Promise.resolve();
    }
    if (this.noEmit) return Promise.resolve();
    return confirm(mergedConfig).then(result => {
      if (result) this._configManager.writeConfig(mergedConfig);
    });
  }

  createProcessor(configFileName?: string) {
    this._configManager = new ConfigManager({ configFileName, logger: this.logger, noEmit: this.noEmit });
    const replacedConfig = this._configManager.replaceEnvValue();
    this.logger.verbose("Config: ", replacedConfig);
    this._pluginManager = new PluginManager(this.logger, this.noEmit, replacedConfig, this._getWorkingDirs());
    this._pluginManager.loadPlugins();
    const keyGenerator = this._pluginManager.initKeyGenerator();
    const publisher = this._pluginManager.initPublisher();
    const notifiers = this._pluginManager.initNotifiers();
    const directoryInfo = this.getDirectoryInfo();
    this.logger.verbose("userDirs: ", this._getUserDirs());
    this.logger.verbose("workingDirs: ", this._getWorkingDirs());
    return new RegProcessor({
      coreConfig: this._configManager.config.core,
      workingDirs: this._getWorkingDirs(),
      logger: this.logger,
      noEmit: this.noEmit,
      options: {
        keyGenerator,
        publisher,
        notifiers,
        userDirs: this._getUserDirs(),
      },
    });
  }

  getDirectoryInfo() {
    return {
      workingDirs: this._getWorkingDirs(),
      userDirs: this._getUserDirs(),
    };
  }

  _getWorkingDirs() {
    const base = path.resolve(fsUtil.prjRootDir(), this._config.core.workingDir);
    return {
      base,
      actualDir: path.join(base, "actual"),
      expectedDir: path.join(base, "expected"),
      diffDir: path.join(base, "diff"),
    };
  }

  _getUserDirs() {
    const actualDir = path.resolve(fsUtil.prjRootDir(), this._config.core.actualDir);
    return {
      actualDir,
    };
  }
}
