import * as resolve from "resolve";
import * as fs from "fs";
import * as path from "path";
import configManager from "./config-manager";
import { RegSuitConfiguration } from "./config-manager";
import logger, { RegLogger } from "./logger";
import {
  KeyGenerator,
  KeyGeneratorPlugin,
  Notifier,
  NotifierPlugin,
  Plugin,
  PluginCreateOptions,
  PluginPreparer,
  PublishResult,
  Publisher,
  PublisherPlugin,
  KeyGeneratorPluginFactory,
  PublisherPluginFactory,
  KeyGeneratorPluginHolder,
  PublisherPluginHolder
} from "./plugin";

import {
  CoreConfig,
  CreateQuestionsOptions,
} from "./core-interface";

const compare = require("reg-cli");

export interface PluginMetadata {
  moduleId: string;
  [key: string]: any;
}

function isPublisher(pluginHolder: PluginMetadata): pluginHolder is (PublisherPluginHolder<any, any> & PluginMetadata) {
  return !!pluginHolder["publisher"];
}

function isKeyGenerator(pluginHolder: PluginMetadata): pluginHolder is (KeyGeneratorPluginHolder<any, any> & PluginMetadata) {
  return !!pluginHolder["keyGenerator"];
}

export interface ComparisonResult {
  failedItems: string[];
  newItems: string[];
  deletedItems: string[],
  passedItems: string[],
  expectedItems: string[];
  actualItems: string[];
  diffItems: string[];
  actualDir: string;
  expectedDir: string;
  diffDir: string;
}

export class RegSuitCore {

  _keyGenerator?: KeyGeneratorPlugin<any>;
  _publisher?: PublisherPlugin<any>;
  notifiers: NotifierPlugin<any>[] = [];

  _logger: RegLogger;
  _config: RegSuitConfiguration;
  _pluginHolders: PluginMetadata[] = [];

  constructor() {
    this._logger = logger;
  }

  _loadPlugins() {
    if (!this._config.plugins) return;
    const pluginNames = Object.keys(this._config.plugins);
    pluginNames.forEach(pluginName => {
      this._loadPlugin(pluginName);
    });
  }

  _loadPlugin(name: string) {
    let pluginFileName = null;
    try {
      pluginFileName = resolve.sync(name, { basedir: process.cwd() });
    } catch (e) {
      // TODO
      this._logger.error(e);
    }
    if (pluginFileName) {
      const factory = require(pluginFileName);
      const pluginHolder = factory();
      this._pluginHolders.push({ ...pluginHolder, moduleId: name });
    }
  }

  _getInstalledPlugins() {
    const cwd = process.cwd();
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(cwd, "package.json"), "utf8"));
      let result: string[] = [];
      if (packageJson["dependencies"]) {
        result = [ ...result, ...Object.keys(packageJson["dependencies"])];
      }
      if (packageJson["devDependencies"]) {
        result = [ ...result, ...Object.keys(packageJson["devDependencies"])];
      }
      return result.filter(dep => {
        return dep.match(/^reg-.*-plugin$/);
      });
    } catch(e) {
      this._logger.error(e);
      return [];
    }
  }

  createQuestions(opt: CreateQuestionsOptions) {
    const config = this._loadConfig();
    const installedPluginNames = this._getInstalledPlugins();
    const holders: { name: string; preparer: PluginPreparer<any, any> }[] = [];
    installedPluginNames.forEach(name => {
      this._loadPlugin(name);
    });
    this._pluginHolders.forEach(h => {
      if (h["preparer"]) {
        holders.push({ name: h.moduleId, preparer: h["preparer"] });
      }
    });
    return holders.map(holder => {
      const questions = holder.preparer.inquire();
      const boundPrepare = (inquireResult: any) => holder.preparer.prepare({
        coreConfig: config.core,
        logger: this._logger,
        options: inquireResult,
      });
      return {
        name: holder.name,
        questions: questions as any, // FIXME
        prepare: boundPrepare,
      };
    });
  }

  persistMergedConfig(opt: { core?: CoreConfig; pluginConfigs: { name: string; config: any }[] }) {
    const baseConfig = this._loadConfig();
    const mergedConfig = {
      core: opt.core ? { ...baseConfig.core, ...opt.core } : baseConfig.core,
      plugins: { } as {[key: string]: any},
    };
    opt.pluginConfigs.forEach(pc => {
      mergedConfig.plugins[pc.name] = baseConfig.plugins ? {
        ...baseConfig.plugins[pc.name],
        ...pc.config,
      } : pc.config;
    });
    configManager.writeConfig(mergedConfig);
  }

  init(configFileName?: string) {
    this._loadConfig(configFileName);
    this._loadPlugins();
    this._initKeyGenerator();
    this._initPublisher();
  }

  _initKeyGenerator() {
    const metadata = this._pluginHolders.filter(holder => isKeyGenerator(holder));
    if (metadata.length > 1) {
      const pluginNames = metadata.map(p => p.moduleId).join(", ");
      this._logger.warn(`2 or more key generator plugins are found. Select one of ${pluginNames}.`);
    } else if (metadata.length === 1 && this._config.plugins) {
      const ph = metadata[0];
      const pluginSpecifiedOption = this._config.plugins[ph.moduleId];
      if (isKeyGenerator(ph) && pluginSpecifiedOption) {
        this._keyGenerator = ph.keyGenerator;
        this._keyGenerator.init({
          coreConfig: this._config.core,
          logger: this._logger,
          options: pluginSpecifiedOption,
        });
        this._logger.verbose(`${ph.moduleId} is inialized with: `);
        this._logger.verbose(`${JSON.stringify(pluginSpecifiedOption, null, 2)}`);
      }
    } else {
      this._logger.verbose("No key generator.");
    }
  }

  _initPublisher() {
    const metadata = this._pluginHolders.filter(holder => isPublisher(holder));
    if (metadata.length > 1) {
      const pluginNames = metadata.map(p => p.moduleId).join(", ");
      this._logger.warn(`2 or more publisher plugins are found. Select one of ${pluginNames}.`);
    } else if (metadata.length === 1 && this._config.plugins) {
      const ph = metadata[0];
      const pluginSpecifiedOption = this._config.plugins[ph.moduleId];
      if (isPublisher(ph) && pluginSpecifiedOption) {
        this._publisher = ph.publisher;
        this._publisher.init({
          coreConfig: this._config.core,
          logger: this._logger,
          options: pluginSpecifiedOption,
        });
        this._logger.verbose(`${ph.moduleId} is inialized with: `);
        this._logger.verbose(`${JSON.stringify(pluginSpecifiedOption, null, 2)}`);
      }
    } else {
      this._logger.verbose("No publisher.");
    }
  }

  _loadConfig(configFileName?: string) {
    if (!this._config) {
      this._config = configManager.readConfig(configFileName).config;
    }
    return this._config;
  }

  runAll() {
    this.getExpectedKey()
    .then(key => this.fetch(key))
    .then(() => this.compare())
    .then(() => this.getActualKey())
    .then(key => this.publish(key))
    .then(result => this.notify(result))
    ;
  }

  compare() {
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
    .catch(x => console.error(x));
  }

  getExpectedKey(): Promise<string | null> {
    if (this._keyGenerator) {
      return this._keyGenerator.getExpectedKey().catch(reason => {
        this._logger.warn("Failed to fetch the expected key");
        this._logger.error(reason);
        return Promise.resolve(null);
      });
    } else {
      this._logger.info("Skipped fetch expected key because key generator plugin is not set up.");
      return Promise.resolve(null);
    }
  }

  getActualKey() {
    const fallbackFn = () => {
      return "snapshot_" + new Date().getTime();
    }
    if (this._keyGenerator) {
      return this._keyGenerator.getActualKey().then(key => {
        if (!key) {
          this._logger.warn("Failed to fetch the actual key.");
          return fallbackFn();
        }
        return key;
      }).catch(reason => {
        this._logger.warn("Failed to fetch the actual key.");
        this._logger.error(reason);
        return Promise.resolve<string>(fallbackFn());
      });
    } else {
      this._logger.info("Skipped to fetch the actual key because key generator plugin is not set.");
      return Promise.resolve<string>(fallbackFn());
    }
  }

  fetch(keyForExpected: string | null) {
    if (this._publisher && keyForExpected) {
      return this._publisher.fetch(keyForExpected);
    } else if (!keyForExpected) {
      this._logger.info("Skipped to fetch the expeceted data because expected key is null.");
      return Promise.resolve();
    } else if (!this._publisher) {
      this._logger.info("Skipped to fetch the expeceted data because publisher plugin is not set.");
      return Promise.resolve();
    }
  }

  publish(keyForActual: string): Promise<PublishResult | null> {
    if (this._publisher) {
      return this._publisher.publish(keyForActual);
    } else {
      return Promise.resolve(null);
    }
  }

  notify(result: PublishResult | null) {
    // TODO
  }
}
