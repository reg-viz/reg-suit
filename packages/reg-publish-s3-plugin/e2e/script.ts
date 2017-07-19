/* tslint:disable:no-console */
import { createLogger } from "reg-suit-util";
import { S3PublisherPlugin } from "../lib/s3-publisher-plugin";
import { S3BucketPreparer } from "../lib/s3-bucket-preparer";
import * as glob from "glob";
import * as assert from "assert";
import { S3 } from "aws-sdk";

const preparer = new S3BucketPreparer();

const plugin = new S3PublisherPlugin();
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

let bn: string;
preparer.prepare({ ...baseConf, options: { createBucket: true, }, workingDirs: dirsA })
.then(({ bucketName }) => {
  bn = bucketName || "";
  plugin.init({
    ...baseConf,
    options: {
      bucketName: bn,
    },
    workingDirs: dirsA,
  });
  return plugin.publish("abcdef12345");
})
.then(() => {
  plugin.init({
    ...baseConf,
    options: {
      bucketName: bn,
    },
    workingDirs: dirsB,
  });
  return plugin.fetch("abcdef12345");
})
.then(() => {
  const list = glob.sync("dir_b/sample01.png", { cwd: dirsB.base });
  assert.equal(list[0], "dir_b/sample01.png");
})
.then(() => {
  return new Promise(resolve => {
    new S3().listObjects({
      Bucket: bn,
    }, (err, result) => {
      if (result.Contents) {
        new S3().deleteObjects({
          Bucket: bn,
          Delete: { Objects: result.Contents.map(c => ({ Key: c.Key as any })) },
        }, (err2, x) => resolve(x));
      }
    });
  });
})
.then(() => {
  new S3().deleteBucket({
    Bucket: bn,
  }, () => {
    console.log(" 🌟  Test was ended successfully! 🌟 ");
    process.exit(0);
  });
})
.catch(err => {
  console.error(err);
  process.exit(1);
})
;

