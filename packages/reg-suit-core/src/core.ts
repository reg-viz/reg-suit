import path from "path";
import { CoreConfig, CreateQuestionsOptions, RegSuitConfiguration } from "reg-suit-interface";
import { createLogger, RegLogger, LogLevel, fsUtil } from "reg-suit-util";

import { ConfigManager } from "./config-manager";
import { PluginManager } from "./plugin-manager";
import { RegProcessor } from "./processor";

export class RegSuitCore {
  noEmit: boolean;
  logger: RegLogger;
  _configManager: ConfigManager;
  _pluginManager!: PluginManager;

  constructor(
    opt: {
      logLevel?: LogLevel;
      noEmit?: boolean;
      configFileName?: string;
    } = {},
  ) {
    this.logger = createLogger();
    if (opt.logLevel) {
      this.logger.setLevel(opt.logLevel);
    }
    this.noEmit = !!opt.noEmit;
    this._configManager = new ConfigManager({
      logger: this.logger,
      noEmit: this.noEmit,
      configFileName: opt.configFileName,
    });
  }

  get config() {
    return this._configManager.config;
  }

  createQuestions(opt: CreateQuestionsOptions) {
    this._pluginManager = new PluginManager(this.logger, this.noEmit, this.config, this._getWorkingDirs());
    return this._pluginManager.createQuestions(opt);
  }

  persistMergedConfig(
    opt: { core?: CoreConfig; pluginConfigs: { name: string; config: any }[] },
    confirm: (newConfig: RegSuitConfiguration) => Promise<boolean>,
  ) {
    const baseConfig = this.config;
    const mergedConfig: RegSuitConfiguration & { plugins: any } = {
      core: opt.core ? { ...baseConfig.core, ...opt.core } : baseConfig.core,
      plugins: { ...baseConfig.plugins },
    };
    opt.pluginConfigs.forEach(pc => {
      mergedConfig.plugins[pc.name] = baseConfig.plugins
        ? {
            ...baseConfig.plugins[pc.name],
            ...pc.config,
          }
        : pc.config;
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

  createProcessor() {
    const replacedConfig = this._configManager.replaceEnvValue();
    this.logger.verbose("Config: ", replacedConfig);
    this._pluginManager = new PluginManager(this.logger, this.noEmit, replacedConfig, this._getWorkingDirs());
    this._pluginManager.loadPlugins();
    const keyGenerator = this._pluginManager.initKeyGenerator();
    const publisher = this._pluginManager.initPublisher();
    const notifiers = this._pluginManager.initNotifiers();
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
      prjDir: this._getPrjDir(),
      workingDirs: this._getWorkingDirs(),
      userDirs: this._getUserDirs(),
    };
  }

  _getPrjDir() {
    return fsUtil.prjRootDir();
  }

  _getWorkingDirs() {
    const base = path.resolve(fsUtil.prjRootDir(), this.config.core.workingDir);
    return {
      base,
      actualDir: path.join(base, "actual"),
      expectedDir: path.join(base, "expected"),
      diffDir: path.join(base, "diff"),
    };
  }

  _getUserDirs() {
    const actualDir = path.resolve(fsUtil.prjRootDir(), this.config.core.actualDir);
    return {
      actualDir,
    };
  }
}
