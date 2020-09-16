import fs from "fs";
import path from "path";
import { CoreConfig, RegSuitConfiguration } from "reg-suit-interface";
import { RegLogger, fsUtil } from "reg-suit-util";

const DEFAULT_CONFIG_FILE_NAME = "regconfig.json";

const ESCAPE_REGEXP = /\$(\$[^\$]+)/g;
const PLACEHOLDER_REGEXP = /\$([^\$]+)/g;
const PLACEHOLDER_REGEXP_BRACE = /\$\{([^\$\{\}]+)\}/g;

function expandPlaceholders(x: any): any {
  if (typeof x === "object") {
    Object.keys(x).forEach(k => {
      x[k] = expandPlaceholders(x[k]);
    });
    return x;
  } else if (Array.isArray(x)) {
    return x.map(() => expandPlaceholders(x));
  } else if (typeof x === "string") {
    if (ESCAPE_REGEXP.test(x)) {
      return x.replace(ESCAPE_REGEXP, (_, g1) => g1);
    } else if (PLACEHOLDER_REGEXP_BRACE.test(x)) {
      return x.replace(PLACEHOLDER_REGEXP_BRACE, (_, g1) => process.env[g1] as string);
    } else if (PLACEHOLDER_REGEXP.test(x)) {
      return x.replace(PLACEHOLDER_REGEXP, (_, g1) => process.env[g1] as string);
    } else {
      return x;
    }
  } else {
    return x;
  }
}

export interface ConfigManagerCreateOptions {
  configFileName?: string;
  logger: RegLogger;
  noEmit: boolean;
}

export class ConfigManager {
  get defaultConfigFileName() {
    return DEFAULT_CONFIG_FILE_NAME;
  }

  /**
   * @internal
   **/
  _loadedConfig!: RegSuitConfiguration;

  private _configFileName?: string;
  private _logger: RegLogger;

  constructor(opt: ConfigManagerCreateOptions) {
    this._configFileName = opt.configFileName;
    this._logger = opt.logger;
  }

  replaceEnvValue(): RegSuitConfiguration {
    const rawConfig = this.config;
    if (!!(<any>rawConfig)["__replaced__"]) return rawConfig;
    expandPlaceholders(rawConfig);
    (<any>rawConfig)["__replaced__"] = true;
    return rawConfig;
  }

  get config() {
    if (!this._loadedConfig) {
      this._loadedConfig = this.readConfig().config;
    }
    return this._loadedConfig;
  }

  readConfig() {
    const defaultCoreConfig = {
      workingDir: ".reg",
      actualDir: "directory_contains_actual_images",
      thresholdRate: 0,
    } as CoreConfig;
    let readResult: any, readJsonObj: any;
    const configFilePath = this._getConfigPath();
    try {
      readResult = fs.readFileSync(configFilePath, "utf8");
    } catch (e) {
      this._logger.verbose(`Failed to load config file: ${this._logger.colors.magenta(configFilePath)}`);
    }
    if (readResult) {
      try {
        readJsonObj = JSON.parse(readResult);
      } catch (e) {
        const msg = `Failed to read ${this._configFileName} because it's invalid JSON file.`;
        this._logger.error(msg);
        this._logger.error(readResult);
        throw new Error(msg);
      }
    }
    if (readJsonObj) {
      return {
        readUserConfig: true,
        config: {
          core: {
            ...defaultCoreConfig,
            ...readJsonObj.core,
          },
          plugins: readJsonObj.plugins,
        } as RegSuitConfiguration,
      };
    } else {
      return {
        readUserConfig: false,
        config: {
          core: defaultCoreConfig,
        } as RegSuitConfiguration,
      };
    }
  }

  writeConfig(config: RegSuitConfiguration) {
    this._loadedConfig = config;
    fs.writeFileSync(this._getConfigPath(), JSON.stringify(config, null, 2), "utf8");
  }

  private _getConfigPath() {
    if (this._configFileName) {
      this._logger.verbose(`config file: ${this._configFileName}`);
      return path.resolve(fsUtil.prjRootDir(), this._configFileName);
    } else {
      this._logger.verbose(`config file not specified, load from ${DEFAULT_CONFIG_FILE_NAME}.`);
      return path.resolve(fsUtil.prjRootDir(), DEFAULT_CONFIG_FILE_NAME);
    }
  }
}
