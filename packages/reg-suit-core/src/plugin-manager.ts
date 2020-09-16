import path from "path";
import {
  Plugin,
  PluginPreparer,
  WorkingDirectoryInfo,
  CreateQuestionsOptions,
  RegSuitConfiguration,
  KeyGeneratorPluginHolder,
  PublisherPluginHolder,
  NotifierPlugin,
  NotifierPluginHolder,
} from "reg-suit-interface";
import { RegLogger, fsUtil } from "reg-suit-util";

export interface PluginMetadata {
  moduleId: string;
  [key: string]: any;
}

function isPublisher(pluginHolder: PluginMetadata): pluginHolder is PublisherPluginHolder<any, any> & PluginMetadata {
  return !!pluginHolder["publisher"];
}

function isKeyGenerator(
  pluginHolder: PluginMetadata,
): pluginHolder is KeyGeneratorPluginHolder<any, any> & PluginMetadata {
  return !!pluginHolder["keyGenerator"];
}

function isNotifier(pluginHolder: PluginMetadata): pluginHolder is NotifierPluginHolder<any, any> & PluginMetadata {
  return !!pluginHolder["notifier"];
}

export class PluginManager {
  /**
   * @internal
   **/
  _pluginHolders: PluginMetadata[] = [];

  constructor(
    private _logger: RegLogger,
    private _noEmit: boolean,
    private _config: RegSuitConfiguration,
    private _workingDirs: WorkingDirectoryInfo,
  ) {}

  loadPlugins() {
    if (!this._config.plugins) return;
    const pluginNames = Object.keys(this._config.plugins);
    pluginNames.forEach(pluginName => this._loadPlugin(pluginName));
  }

  createQuestions(opt: CreateQuestionsOptions) {
    const noConfigurablePlugins: string[] = [];
    const preparerHolders: { name: string; preparer: PluginPreparer<any, any> }[] = [];
    opt.pluginNames.forEach(name => this._loadPlugin(name));
    this._pluginHolders.forEach(h => {
      if (h["preparer"]) {
        preparerHolders.push({ name: h.moduleId, preparer: h["preparer"] });
      } else {
        noConfigurablePlugins.push(h.moduleId);
      }
    });
    return [
      ...noConfigurablePlugins.map(pluginName => {
        return {
          name: pluginName,
          questions: [] as any[],
          prepare: () => Promise.resolve<any>(true),
          configured: null,
        };
      }),
      ...preparerHolders.map(holder => {
        const questions = holder.preparer.inquire();
        const boundPrepare = (inquireResult: any) =>
          holder.preparer.prepare({
            coreConfig: this._config.core,
            workingDirs: this._workingDirs,
            logger: this._logger.fork(holder.name),
            options: inquireResult,
            noEmit: this._noEmit,
          });
        const configured =
          this._config.plugins && typeof this._config.plugins[holder.name] === "object"
            ? this._config.plugins[holder.name]
            : null;
        return {
          name: holder.name,
          // FIXME
          // TS4053 Return type of public method from exported class has or is using name 'inquirer.Question' from external module "reg-suit-core/node_modules/@types/inquirer/index" but cannot be named.
          questions: questions as any[],
          prepare: boundPrepare,
          configured,
        };
      }),
    ];
  }

  initKeyGenerator() {
    const metadata = this._pluginHolders.filter(holder => isKeyGenerator(holder));
    if (metadata.length === 0) {
      this._logger.verbose("No key generator plugin.");
      return;
    } else if (metadata.length > 1) {
      const pluginNames = metadata.map(p => p.moduleId).join(", ");
      this._logger.warn(`2 or more key generator plugins are found. Select one of ${pluginNames}.`);
      return;
    }
    const ph = metadata[0];
    if (isKeyGenerator(ph)) {
      return this._initPlugin(ph.keyGenerator, ph);
    }
  }

  initPublisher() {
    const metadata = this._pluginHolders.filter(holder => isPublisher(holder));
    if (metadata.length === 0) {
      this._logger.verbose("No publisher plugin.");
      return;
    } else if (metadata.length > 1) {
      const pluginNames = metadata.map(p => p.moduleId).join(", ");
      this._logger.warn(`2 or more publisher plugins are found. Select one of ${pluginNames}.`);
      return;
    }
    const ph = metadata[0];
    if (isPublisher(ph)) {
      return this._initPlugin(ph.publisher, ph);
    }
  }

  initNotifiers() {
    const notifiers: NotifierPlugin<any>[] = [];
    const metadata = this._pluginHolders.filter(holder => isNotifier(holder));
    if (metadata.length === 0) {
      this._logger.verbose("No notifier plugin.");
    } else {
      metadata.forEach(ph => {
        if (isNotifier(ph)) {
          const np = this._initPlugin(ph.notifier, ph);
          np && notifiers.push(np);
        }
      });
    }
    return notifiers;
  }

  /**
   * @internal
   **/
  _resolve(name: string, base: string) {
    if (name.startsWith(".")) {
      return require.resolve(path.resolve(base, name));
    } else {
      for (let i = 0; i < 10; i++) {
        try {
          return require.resolve(path.resolve(base, "node_modules", name));
        } catch (e) {
          base = path.resolve(base, "..");
        }
      }
      throw new Error("Cannot find module " + name);
    }
  }

  private _loadPlugin(name: string) {
    let pluginFileName = null;
    const basedir = fsUtil.prjRootDir();
    try {
      pluginFileName = this._resolve(name, basedir);
      this._logger.verbose(`Loaded plugin from ${this._logger.colors.magenta(pluginFileName)}`);
    } catch (e) {
      this._logger.error(`Failed to load plugin '${name}'`);
      throw e;
    }
    if (pluginFileName) {
      const factory = require(pluginFileName);
      const pluginHolder = factory();
      this._pluginHolders.push({ ...pluginHolder, moduleId: name });
    }
  }

  private _initPlugin<S extends { disabled?: boolean }, P extends Plugin<S>>(
    targetPlugin: P,
    metadata: PluginMetadata,
  ): P | undefined {
    let pluginSpecifiedOption: S;
    if (this._config.plugins && this._config.plugins[metadata.moduleId]) {
      pluginSpecifiedOption = this._config.plugins[metadata.moduleId];
    } else {
      pluginSpecifiedOption = { disabled: true } as S;
    }
    if (pluginSpecifiedOption.disabled === true) {
      this._logger.verbose(`${metadata.moduleId} is disabled.`);
      return;
    }
    targetPlugin.init({
      coreConfig: this._config.core,
      workingDirs: this._workingDirs,
      logger: this._logger.fork(metadata.moduleId),
      options: pluginSpecifiedOption,
      noEmit: this._noEmit,
    });
    this._logger.verbose(`${metadata.moduleId} is inialized with: `, pluginSpecifiedOption);
    return targetPlugin;
  }
}
