import { CliOptions } from "../cli-options";
import getRegCore from "../get-reg-core";

function run(options: CliOptions) {
  const core = getRegCore(options);
  core.init(options.configFileName);
  return core.runAll().then(() => Promise.resolve());
}

export default run;
