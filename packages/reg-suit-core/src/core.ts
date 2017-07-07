import * as fs from "fs";
import * as path from "path";
import { createLogger, RegLogger, LogLevel } from "reg-suit-util";
import configManager, { ConfigManager } from "./config-manager";

import {
  KeyGenerator,
  KeyGeneratorPlugin,
  Notifier,
  NotifierPlugin,
  Plugin,
  Publisher,
  PublisherPlugin,
  NotifyParams,
  CoreConfig,
  CreateQuestionsOptions,
  RegSuitConfiguration,
  ComparisonResult,
} from "reg-suit-interface";

import { PluginManager } from "./plugin-manager";

const compare = require("reg-cli");

export interface StepResultAfterExpectedKey {
  expectedKey: string | null;
}

export interface StepResultAfterComparison extends StepResultAfterExpectedKey {
  comparisonResult: ComparisonResult;
}

export interface StepResultAfterActualKey extends StepResultAfterComparison {
  actualKey: string ;
}

export interface StepResultAfterPublish extends StepResultAfterActualKey {
  reportUrl: string | null;
}

export class RegSuitCore {

  _keyGenerator?: KeyGeneratorPlugin<any>;
  _publisher?: PublisherPlugin<any>;
  _notifiers: NotifierPlugin<any>[] = [];

  noEmit: boolean;
  logger: RegLogger;
  _pluginManager: PluginManager;
  _config: RegSuitConfiguration;
  _configManager: ConfigManager;

  constructor(opt?: {
    logLevel?: LogLevel;
    noEmit?: boolean;
  }) {
    this.logger = createLogger();
    this._configManager = configManager;
    if (opt && opt.logLevel) {
      this.logger.setLevel(opt.logLevel);
    }
    this.noEmit = !!(opt && opt.noEmit);
    this._pluginManager = new PluginManager(this.logger, this.noEmit);
    this._pluginManager.rawConfig = this._loadConfig();
  }

  createQuestions(opt: CreateQuestionsOptions) {
    return this._pluginManager.createQuestions(opt);
  }

  persistMergedConfig(opt: { core?: CoreConfig; pluginConfigs: { name: string; config: any }[] }, confirm: (newConfig: RegSuitConfiguration) => Promise<boolean>) {
    const baseConfig = this._loadConfig();
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
    this.logger.verbose("Merged configuration: ", mergedConfig);
    if (JSON.stringify(baseConfig) === JSON.stringify(mergedConfig)) {
      // If there is no difference, exit quietly.
      return Promise.resolve();
    }
    if (this.noEmit) return Promise.resolve();
    return confirm(mergedConfig).then(result => {
      if (result) this._configManager.writeConfig(mergedConfig);
    });
  }

  init(configFileName?: string) {
    const rawConfig = this._loadConfig(configFileName);
    this._pluginManager.rawConfig = rawConfig;
    this._pluginManager.replacedConfig = this._configManager.replaceEnvValue(rawConfig);
    this._pluginManager.loadPlugins();
    this._keyGenerator = this._pluginManager.initKeyGenerator();
    this._publisher = this._pluginManager.initPublisher();
    this._notifiers = this._pluginManager.initNotifiers();
  }

  _loadConfig(configFileName?: string) {
    if (!this._config) {
      if (configFileName) {
        this.logger.verbose(`config file: ${configFileName}`);
      } else {
        this.logger.verbose(`config file not specified, load from ${configManager.defaultConfigFileName}.`);
      }
      this._config = this._configManager.readConfig(configFileName).config;
    }
    return this._config;
  }

  getDirectoryInfo(configFileName?: string) {
    this._loadConfig(configFileName);
    const actualDir = path.join(path.resolve(process.cwd(), this._config.core.workingDir), this._config.core.actualDir);
    const expectedDir = path.join(path.resolve(process.cwd(), this._config.core.workingDir), this._config.core.expectedDir);
    return {
      actualDir,
      expectedDir,
    };
  }

  runAll() {
    return this.getExpectedKey()
    .then(ctx => this.fetch(ctx))
    .then(ctx => this.compare(ctx))
    .then(ctx => this.getActualKey(ctx))
    .then(ctx => this.publish(ctx))
    .then(ctx => this.notify(ctx))
    ;
  }

  getExpectedKey(): Promise<StepResultAfterExpectedKey> {
    if (this._keyGenerator) {
      return this._keyGenerator.getExpectedKey()
        .then(key => {
          this.logger.info(`Detected the previous snapshot key: '${key}'`);
          return { expectedKey: key };
        })
        .catch(reason => {
          this.logger.warn("Failed to detect the previous snapshot key");
          this.logger.error(reason);
          return Promise.resolve({ expectedKey: null });
        })
      ;
    } else {
      this.logger.info("Skipped to detect the previous snapshot key because key generator plugin is not set up.");
      return Promise.resolve({ expectedKey: null });
    }
  }

  compare(ctx: StepResultAfterExpectedKey): Promise<StepResultAfterComparison> {
    return (compare({
      actualDir: path.join(this._config.core.workingDir, this._config.core.actualDir),
      expectedDir: path.join(this._config.core.workingDir, this._config.core.expectedDir),
      diffDir: path.join(this._config.core.workingDir, "diff"),
      json: path.join(this._config.core.workingDir, "out.json"),
      report: path.join(this._config.core.workingDir, "index.html"),
      update: false,
      ignoreChange: true,
      urlPrefix: "",
      threshold: .5,
    }) as Promise<ComparisonResult>)
    .then(result => {
      this.logger.verbose("Comparison result:", result);
      return { ...ctx, comparisonResult: result };
    })
    .catch(reason => {
      // re-throw notifiers error because it's fatal.
      this.logger.error("An error occurs during compare images:");
      this.logger.error(reason);
      return Promise.reject<StepResultAfterComparison>(reason);
    });
  }

  getActualKey(ctx: StepResultAfterComparison): Promise<StepResultAfterActualKey> {
    const fallbackFn = () => "snapshot_" + ~~(new Date().getTime() / 1000);
    if (this._keyGenerator) {
      return this._keyGenerator.getActualKey().then(key => {
        if (!key) {
          this.logger.warn("Failed to generate the current snapshot key.");
          return { ...ctx, actualKey: fallbackFn() };
        }
        this.logger.info(`The current snapshot key: '${key}'`);
        return { ...ctx, actualKey: key };
      }).catch(reason => {
        this.logger.warn("Failed to gerenate the current snapshot key.");
        this.logger.error(reason);
        return Promise.resolve({ ...ctx, actualKey: fallbackFn() });
      });
    } else {
      const fallbackKey = fallbackFn();
      this.logger.info(`Use '${fallbackKey}' as the current snapshot key because key generator plugin is not set up.`);
      return Promise.resolve({ ...ctx, actualKey: fallbackKey });
    }
  }

  fetch(ctx: StepResultAfterExpectedKey): Promise<StepResultAfterExpectedKey> {
    const keyForExpected = ctx.expectedKey;
    if (this._publisher && keyForExpected) {
      return this._publisher.fetch(keyForExpected);
    } else if (!keyForExpected) {
      this.logger.info("Skipped to fetch the expeceted data because expected key is null.");
      return Promise.resolve(ctx);
    } else if (!this._publisher) {
      this.logger.info("Skipped to fetch the expeceted data because publisher plugin is not set up.");
      return Promise.resolve(ctx);
    } else {
      return Promise.resolve(ctx);
    }
  }

  publish(ctx: StepResultAfterActualKey): Promise<StepResultAfterPublish> {
    if (this._publisher) {
      return this._publisher.publish(ctx.actualKey)
        .then(result => {
          this.logger.info(`Published snapshot '${ctx.actualKey}' successfully.`);
          if (result.reportUrl) {
            this.logger.info(`Report URL: ${result.reportUrl}`);
          }
          this.logger.verbose("Publish result:", result);
          return { ...ctx, reportUrl: result.reportUrl };
        })
        .catch(reason => {
          // re-throw notifiers error because it's fatal.
          this.logger.error("An error occurs during publishing snapshot:");
          this.logger.error(reason);
          return Promise.reject<StepResultAfterPublish>(reason);
        })
      ;
    } else {
      this.logger.info("Skipped to publish the snapshot data because publisher plugin is not set up.");
      return Promise.resolve(ctx);
    }
  }

  notify(ctx: StepResultAfterPublish): Promise<StepResultAfterPublish> {
    const notifyParams: NotifyParams = {
      ...ctx,
    };
    if (!this._notifiers.length) {
      this.logger.info("Skipped to notify result because notifier plugins are not set up.");
    }
    this.logger.verbose("Notify parameters:", notifyParams);
    return Promise.all(
      this._notifiers.map((notifier) => {
        return notifier.notify(notifyParams).catch((reason) => {
          // Don't re-throw notifiers error because it's not fatal.
          this.logger.error("An error occurs during notify:");
          this.logger.error(reason);
          return Promise.resolve();
        });
      })
    ).then(() => ctx);
  }
}
