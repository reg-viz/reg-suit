import * as child_process from "child_process";
import * as path from "path";
import * as resolve from "resolve";

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
}

const packageUtil = new PackageUtil();
export default packageUtil;
