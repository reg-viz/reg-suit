import { CliOptions } from "../cli-options";
import getRegCore from "../get-reg-core";

function run(options: CliOptions) {
  const processor = getRegCore(options).createProcessor();
  return processor.runAll().then(() => Promise.resolve());
}

export default run;
