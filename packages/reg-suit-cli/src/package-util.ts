import child_process from "child_process";
import fs from "fs";
import path from "path";
import { fsUtil } from "reg-suit-util";

export const PLUGIN_NAME_REGEXP = /^reg-.*-plugin$/;
const CLI_MODULE_ID = require(path.join(__dirname, "..", "package.json"))["name"] as string;

export type NpmClient = "npm" | "yarn" | "yarn workspace";

export class PackageUtil {
  installPackages(client: NpmClient, packageNames: string[]): Promise<string[]> {
    if (!packageNames.length) return Promise.resolve([]);
    const cliArguments: string[] = [];
    if (client === "npm") {
      cliArguments.push("npm");
      cliArguments.push("install");
      cliArguments.push("-D");
    } else if (client === "yarn") {
      cliArguments.push("yarn");
      cliArguments.push("add");
      cliArguments.push("-D");
    } else if (client === "yarn workspace") {
      cliArguments.push("yarn");
      cliArguments.push("add");
      cliArguments.push("-D");
      cliArguments.push("-W");
    }
    const args = [...cliArguments, ...packageNames];
    return new Promise((resolve, reject) => {
      child_process.exec(args.join(" "), error => {
        if (error) {
          return reject(error);
        }
        return resolve(packageNames);
      });
    });
  }

  installPluginAndCli(client: NpmClient, pluginNames: string[]) {
    return this.installPackages(client, [CLI_MODULE_ID, ...pluginNames]);
  }

  checkInstalled(pkgName: string): string | null {
    const prjDir = fsUtil.prjRootDir();
    try {
      return path.dirname(require.resolve(path.join(prjDir, "node_modules", pkgName, "package.json")));
    } catch (e) {
      return null;
    }
  }

  checkInstalledLocalCore() {
    return this.checkInstalled("reg-suit-core");
  }

  checkInstalledLocalCli() {
    return this.checkInstalled(CLI_MODULE_ID);
  }

  getInstalledPlugins() {
    const cwd = process.cwd();
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(cwd, "package.json"), "utf8"));
      let result: string[] = [];
      if (packageJson["dependencies"]) {
        result = [...result, ...Object.keys(packageJson["dependencies"])];
      }
      if (packageJson["devDependencies"]) {
        result = [...result, ...Object.keys(packageJson["devDependencies"])];
      }
      return result.filter(dep => PLUGIN_NAME_REGEXP.test(dep));
    } catch (e) {
      return [];
    }
  }
}

const packageUtil = new PackageUtil();

export default packageUtil;
