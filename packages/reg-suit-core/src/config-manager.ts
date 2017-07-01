import * as fs from "fs";
import * as path from "path";
import { CoreConfig } from "./core-interface";

export interface RegSuitConfiguration {
  core: CoreConfig;
  plugins?: {
    [key: string]: any;
  }
}

const DEFAULT_CONFIG_FILE_NAME = "regconfig.json";

export class ConfigManager {

  readConfig(configFileName: string = DEFAULT_CONFIG_FILE_NAME) {
    const defaultCoreConfig = {
      workingDir: path.join(process.cwd(), "./reg"),
      actualDir: "actual",
      expectedDir: "expected",
    } as CoreConfig;
    let readResult, readJsonObj;
    try {
      readResult = fs.readFileSync(path.resolve(process.cwd(), configFileName), "utf8");
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

  writeConfig() {
    // TODO
  }
}

const configManager = new ConfigManager();
export default configManager;
