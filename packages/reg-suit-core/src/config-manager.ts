import * as fs from "fs";
import * as path from "path";
import { CoreConfig, RegSuitConfiguration } from "reg-suit-interface";

const DEFAULT_CONFIG_FILE_NAME = "regconfig.json";

export class ConfigManager {

  get defaultConfigFileName() {
    return DEFAULT_CONFIG_FILE_NAME;
  }

  readConfig(configFileName: string = DEFAULT_CONFIG_FILE_NAME) {
    const defaultCoreConfig = {
      workingDir: path.join(process.cwd(), "./reg"),
      actualDir: "actual",
      expectedDir: "expected",
    } as CoreConfig;
    let readResult, readJsonObj;
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

const configManager = new ConfigManager();
export default configManager;
