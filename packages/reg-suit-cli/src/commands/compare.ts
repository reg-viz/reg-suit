import { CliOptions } from "../cli-options";
import getRegCore from "../get-reg-core";

async function compare(options: CliOptions) {
  const processor = getRegCore(options).createProcessor();
  const ctx = await processor.getExpectedKey();
  await processor.compare(ctx);
  return null;
}

export default compare;
