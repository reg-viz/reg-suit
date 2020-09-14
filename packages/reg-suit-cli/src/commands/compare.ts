import { CliOptions } from "../cli-options";
import getRegCore from "../get-reg-core";

function compare(options: CliOptions) {
  const processor = getRegCore(options).createProcessor();
  return processor
    .getExpectedKey()
    .then(ctx => processor.compare(ctx))
    .then(ctx => null);
}

export default compare;
