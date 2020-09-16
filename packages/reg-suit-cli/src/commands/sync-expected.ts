import { CliOptions } from "../cli-options";
import getRegCore from "../get-reg-core";

function syncExpected(options: CliOptions) {
  const processor = getRegCore(options).createProcessor();
  return processor
    .getExpectedKey()
    .then(ctx => processor.syncExpected(ctx))
    .then(() => null);
}

export default syncExpected;
