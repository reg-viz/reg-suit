import fs from "fs";
import path from "path";
import { ComparisonResult } from "reg-suit-interface";
import { CliOptions } from "../cli-options";
import getRegCore from "../get-reg-core";

function publish(options: CliOptions) {
  const core = getRegCore(options);
  const processor = core.createProcessor();
  const resultPath = path.join(core.getDirectoryInfo().workingDirs.base, "out.json");
  let comparisonResult: ComparisonResult;
  try {
    comparisonResult = JSON.parse(fs.readFileSync(resultPath, "utf8"));
  } catch (e) {
    core.logger.error(
      `Not found comparison result file. Retry after execution ${core.logger.colors.cyan("reg-suit compare")}.`,
    );
    return Promise.reject(e);
  }
  return processor
    .getExpectedKey()
    .then(ctx =>
      processor.getActualKey({
        comparisonResult,
        expectedKey: ctx.expectedKey,
      }),
    )
    .then(ctx => processor.publish(ctx))
    .then(ctx => (options.notification ? processor.notify(ctx) : ctx))
    .then(() => null);
}

export default publish;
