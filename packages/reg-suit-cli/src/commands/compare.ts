import { CliOptions } from "../cli-options";
import getRegCore from "../get-reg-core";

async function compare(options: CliOptions) {
  const processor = getRegCore(options).createProcessor();
  const ctx = await processor.getExpectedKey();
  const { comparisonResult } = await processor.compare(ctx);
  const numberOfFailed = comparisonResult.failedItems.length;
  
  if (numberOfFailed) {
    throw new Error(`There were ${numberOfFailed} failed snapshots`);
  }
  
  return null;
}

export default compare;
