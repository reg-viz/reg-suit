import { createLogger } from "reg-suit-util";
import { GcsPublisherPlugin } from "../lib/gcs-publisher-plugin";
import { GcsBucketPreparer } from "../lib/gcs-bucket-preparer";
import glob from "glob";
import assert from "assert";
import { Storage } from "@google-cloud/storage";

const preparer = new GcsBucketPreparer();

const logger = createLogger();
logger.setLevel("verbose");
const baseConf = {
  coreConfig: { actualDir: "", workingDir: "" },
  logger,
  noEmit: false,
};

const dirsA = {
  base: __dirname + "/../e2e/report-fixture",
  actualDir: __dirname + "/../e2e/report-fixture/dir_a",
  expectedDir: __dirname + "/../e2e/report-fixture/dir_b",
  diffDir: "",
};

const dirsB = {
  base: __dirname + "/../e2e/report-fixture-expected",
  actualDir: __dirname + "/../e2e/report-fixture-expected/dir_a",
  expectedDir: __dirname + "/../e2e/report-fixture-expected/dir_b",
  diffDir: "",
};

async function after(bn: string) {
  const bucket = await new Storage().bucket(bn);
  await bucket.deleteFiles();
  await bucket.delete();
}

async function case1() {
  const { bucketName } = await preparer.prepare({ ...baseConf, options: { createBucket: true }, workingDirs: dirsA });
  try {
    const plugin = new GcsPublisherPlugin();
    plugin.init({
      ...baseConf,
      options: {
        bucketName,
      },
      workingDirs: dirsA,
    });
    const { reportUrl } = await plugin.publish("abcdef12345");
    if (!reportUrl) {
      throw new Error("no report url");
    }

    plugin.init({
      ...baseConf,
      options: {
        bucketName,
      },
      workingDirs: dirsB,
    });
    await plugin.fetch("abcdef12345");

    const list = glob.sync("dir_b/sample01.png", { cwd: dirsB.base });
    assert.equal(list[0], "dir_b/sample01.png");
    logger.info(reportUrl);
    await after(bucketName);
  } catch (e) {
    await after(bucketName);
    throw e;
  }
}

async function main() {
  try {
    await case1();
    // eslint-disable-next-line no-console
    console.log(" 🌟  Test was ended successfully! 🌟 ");
    process.exit(0);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  }
}

main();
