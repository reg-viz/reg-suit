import path from "path";
import inquirer from "inquirer";
import cpFile from "cp-file";

import { CliOptions } from "../cli-options";

import install from "./install";
import prepare from "./prepare";
import packageUtil from "../package-util";
import getRegCore from "../get-reg-core";

function init(options: CliOptions) {
  return install(options)
    .then(() => prepare(options, true))
    .then(() => {
      return inquirer
        .prompt([
          {
            name: "copyFromSample",
            message: "Copy sample images to working dir",
            type: "confirm",
            default: true,
          },
        ])
        .then(({ copyFromSample }: { [key: string]: boolean }) => {
          const core = getRegCore(options);
          const { actualDir } = core.getDirectoryInfo().userDirs;
          core.logger.info("Initialization ended successfully \u2728");
          if (copyFromSample) {
            const fromDir = packageUtil.checkInstalled("reg-cli");
            if (fromDir) {
              return Promise.all(
                ["actual"].map(name => {
                  const fromPath = path.join(fromDir, "report", "sample", name, "sample.png");
                  const toPath = path.join(actualDir, "sample.png");
                  return cpFile(fromPath, toPath).then(() => {
                    core.logger.verbose(`Copied file from ${fromPath} to ${toPath}.`);
                  });
                }),
              ).then(() => {
                core.logger.info("Execute 'reg-suit run' \u2B50");
              });
            }
          } else {
            core.logger.info(`Put your images files into ${actualDir}.`);
          }
        });
    });
}

export default init;
