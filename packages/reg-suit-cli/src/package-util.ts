import * as child_process from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as resolve from "resolve";

export const PLUGIN_NAME_REGEXP = /^reg-.*-plugin$/;
const CLI_MODULE_ID = require(path.join(__dirname, "..", "package.json"))["name"] as string;

export type NpmClient = "npm" | "yarn";

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
    }
    const args = [...cliArguments, ...packageNames];
    return new Promise((resolve, reject) => {
      child_process.exec(args.join(" "), (error, stdout, stderr) => {
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
    try {
      return path.dirname(resolve.sync(`${pkgName}/package.json`, {
        basedir: process.cwd(),
      }));
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
        result = [ ...result, ...Object.keys(packageJson["dependencies"])];
      }
      if (packageJson["devDependencies"]) {
        result = [ ...result, ...Object.keys(packageJson["devDependencies"])];
      }
      return result.filter(dep => PLUGIN_NAME_REGEXP.test(dep));
    } catch (e) {
      return [];
    }
  }
}

const packageUtil = new PackageUtil();
export default packageUtil;
