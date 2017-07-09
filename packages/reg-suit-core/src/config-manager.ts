import * as fs from "fs";
import * as path from "path";
import { CoreConfig, RegSuitConfiguration } from "reg-suit-interface";
import { RegLogger } from "reg-suit-util";

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
      workingDir: path.join(process.cwd(), "./reg"),
      actualDir: "actual",
      expectedDir: "expected",
    } as CoreConfig;
    let readResult: any, readJsonObj: any;
    try {
      readResult = fs.readFileSync(this._getConfigPath(configFileName), "utf8");
      readJsonObj = JSON.parse(readResult);
    } catch(e) {
      // TODO logging
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
    return path.resolve(process.cwd(), configFileName);
  }
}
