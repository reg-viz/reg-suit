import * as resolve from "resolve";
import configManager from "./config-manager";
import { RegSuitConfiguration } from "./config-manager";
import logger, { RegLogger } from "./logger";

export interface KeyGenerator {
  getExpectedKey(): Promise<string>;
  getActualKey(): Promise<string>;
}

export interface Publisher {
  fetch(key: string): Promise<any>;
  publish(key: string): Promise<any>;
}

export interface Notifier {
  notify(result: any): void;
}

export interface CoreConfig {
  workingDir: string;
  expectedDir: string;
  actualDir: string;
}

export interface Logger {
  info(msg: string): void;
  warn(msg: string): void;
  error(msg: string | Error): void;
  verbose(msg: string): void;
}

export interface PluginCreateOptions<T> {
  coreConfig: CoreConfig;
  logger: Logger;
  options: T;
}

export interface Plugin<T> {
  init(config: PluginCreateOptions<T>): void; 
}

export interface PluginPreparer<S, T> {
  inquire(opt: any): Promise<S>;
  prepare(option: PluginCreateOptions<S>): Promise<T>;
}

export interface KeyGeneratorPlugin<T> extends KeyGenerator, Plugin<T> { }
export interface PublisherPlugin<T> extends Publisher, Plugin<T> { }
export interface NotifierPlugin<T> extends Notifier, Plugin<T> { }

export interface KeyGeneratorPluginHolder<S, T> {
  preparer?: PluginPreparer<S, T>;
  keyGenerator: KeyGeneratorPlugin<T>;
}

export interface PublisherPluginHolder<S, T> {
  preparer?: PluginPreparer<S, T>;
  publisher: PublisherPlugin<T>;
}

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

export type KeyGeneratorPluginFactory = <S, T>() => KeyGeneratorPluginHolder<S, T>;
export type PublisherPluginFactory = <S, T>() => PublisherPluginHolder<S, T>;

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

  prepare(configFileName?: string) {
    this._loadConfig(configFileName);
    this._loadPlugins();
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
    this.getKeyForActual();
    this.getKeyForExpected();
    this.fetch("");
    this.compare();
    this.publish("");
    this.notify();
  }

  compare() {
  }

  getKeyForExpected() {
  }

  getKeyForActual() {
  }

  fetch(keyForExpected: string) {
    if (this._publisher) {
      return this._publisher.fetch(keyForExpected);
    } else {
      return Promise.resolve();
    }
  }

  publish(keyForActual: string) {
    if (this._publisher) {
      return this._publisher.publish(keyForActual);
    } else {
      return Promise.resolve();
    }
  }

  notify() {
  }
}
