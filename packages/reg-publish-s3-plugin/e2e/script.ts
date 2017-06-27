import { S3PublisherPlugin } from "../lib/s3-publisher-plugin";
import { S3BucketPreparer } from "../lib/s3-bucket-preparer";
import * as glob from "glob";
import * as assert from "assert";
import { S3 } from "aws-sdk";

const preparer = new S3BucketPreparer();

const plugin = new S3PublisherPlugin();
const baseConfA = {
  coreConfig: {
    actualDir: "dir_a",
    expectedDir: "dir_b",
    workingDir: __dirname + "/../e2e/report-fixture",
  },
  logger: {
    info: (msg: string) => console.log(msg),
    warn: (msg: string) => console.warn(msg),
    verbose: (msg: string) => console.log(msg),
  },
};

const baseConfB = {
  coreConfig: {
    actualDir: "dir_a",
    expectedDir: "dir_b",
    workingDir: __dirname + "/../e2e/report-fixture-expected",
  },
  logger: {
    info: (msg: string) => console.log(msg),
    warn: (msg: string) => console.warn(msg),
    verbose: (msg: string) => console.log(msg),
  },
};

let bn: string;
preparer.prepare({ ...baseConfA, options: { createBucket: true, } })
.then(({ bucketName }) => {
  bn = bucketName || "";
  plugin.init({
    ...baseConfA,
    options: {
      bucketName: bn,
    }
  });
  return plugin.publish("abcdef12345");
})
.then(() => {
  plugin.init({
    ...baseConfB,
    options: {
      bucketName: bn,
    }
  });
  return plugin.fetch("abcdef12345");
})
.then(() => {
  const list = glob.sync("dir_b/sample01.png", { cwd: baseConfB.coreConfig.workingDir });
  assert.equal(list[0], "dir_b/sample01.png");
  console.log(" 🌟  Test was ended successfully! 🌟 ");
})
.then(() => {
  new S3().deleteBucket({
    Bucket: bn,
  }, () => {
    process.exit(0);
  });
})
.catch(err => {
  console.error(err);
  process.exit(1);
})
;

