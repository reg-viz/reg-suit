import * as fs from "fs";
import * as path from "path";
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
    return x.map(item => expandPlaceholders(x));
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

export class ConfigManager {

  get defaultConfigFileName() {
    return DEFAULT_CONFIG_FILE_NAME;
  }

  constructor(private _logger: RegLogger, private _noEmit: boolean) { }

  replaceEnvValue(rawConfig: RegSuitConfiguration): RegSuitConfiguration {
    if (!rawConfig.plugins) return rawConfig;
    const plugins = { ...rawConfig.plugins };
    if (!!((<any>rawConfig)["__replaced__"])) return rawConfig;
    expandPlaceholders(plugins);
    (<any>rawConfig)["__replaced__"] = true;
    return { ...rawConfig, plugins };
  }

  readConfig(configFileName: string = DEFAULT_CONFIG_FILE_NAME) {
    const defaultCoreConfig = {
      workingDir: ".reg",
      actualDir: "directory_contains_actual_images",
      threshold: 0,
    } as CoreConfig;
    let readResult: any, readJsonObj: any;
    const configFilePath = this._getConfigPath(configFileName);
    try {
      readResult = fs.readFileSync(configFilePath, "utf8");
    } catch (e) {
      this._logger.warn(`Failed to load config file: ${this._logger.colors.magenta(configFilePath)}`);
    }
    try {
      readJsonObj = JSON.parse(readResult);
    } catch (e) {
      const msg = `Failed to read ${configFileName} because it's invalid JSON file.`;
      this._logger.error(msg);
      this._logger.error(readResult);
      throw new Error(msg);
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

  writeConfig(config: RegSuitConfiguration, configFileName: string = DEFAULT_CONFIG_FILE_NAME) {
    fs.writeFileSync(this._getConfigPath(configFileName), JSON.stringify(config, null, 2), "utf8");
  }

  private _getConfigPath(configFileName: string) {
    return path.resolve(fsUtil.prjRootDir(), configFileName);
  }
}
