import * as fs from "fs";
import * as path from "path";

export class FsUtil {
  lookup(fileOrDirName: string, firstDir = process.cwd(), level = 10): string | undefined {
    if (!level) return;
    try {
      const target = path.join(firstDir, fileOrDirName);
      fs.statSync(target);
      return target;
    } catch (e) {
      return this.lookup(fileOrDirName, path.resolve(firstDir, ".."), level - 1);
    }
  }

  prjRootDir(configFileName = "package.json") {
    const c = this.lookup(configFileName);
    if (c) {
      return path.dirname(c);
    } else {
      return process.cwd();
    }
  }
}

export const fsUtil = new FsUtil();
