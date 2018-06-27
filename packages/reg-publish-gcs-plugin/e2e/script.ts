/* tslint:disable:no-console */
import { createLogger } from "reg-suit-util";
import { GcsPublisherPlugin } from "../lib/gcs-publisher-plugin";
import { GcsBucketPreparer } from "../lib/gcs-bucket-preparer";
import * as glob from "glob";
import * as assert from "assert";
import Gcs from "@google-cloud/storage";

const projectId = "reg-suit-development";
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
  await Gcs({
    projectId,
  }).bucket(bn).delete();
  // await new Promise(resolve => {
  //   new S3().listObjects({
  //     Bucket: bn,
  //   }, (err, result) => {
  //     if (result.Contents) {
  //       new S3().deleteObjects({
  //         Bucket: bn,
  //         Delete: { Objects: result.Contents.map(c => ({ Key: c.Key as any })) },
  //       }, (err2, x) => resolve(x));
  //     }
  //   });
  // });
  // 
  // await new Promise(resolve => new S3().deleteBucket({ Bucket: bn }, resolve));
}

async function case1() {
  const { bucketName } = await preparer.prepare({ ...baseConf, options: { projectId, createBucket: true, }, workingDirs: dirsA });
  const plugin = new GcsPublisherPlugin();
  plugin.init({
    ...baseConf,
    options: {
      projectId,
      bucketName,
    },
    workingDirs: dirsA,
  });
  await plugin.publish("abcdef12345");

  plugin.init({
    ...baseConf,
    options: {
      projectId,
      bucketName,
    },
    workingDirs: dirsB,
  });
  await plugin.fetch("abcdef12345");

  const list = glob.sync("dir_b/sample01.png", { cwd: dirsB.base });
  assert.equal(list[0], "dir_b/sample01.png");

  await after(bucketName);
}

// async function case2() {
//   const { bucketName } = await preparer.prepare({ ...baseConf, options: { createBucket: true, }, workingDirs: dirsA });
//   const plugin = new GcsPublisherPlugin();
//   plugin.init({
//     ...baseConf,
//     options: {
//       bucketName,
//       pathPrefix: "artifacts",
//       sse: true,
//     },
//     workingDirs: dirsA,
//   });
//   await plugin.publish("abcdef12345");
//   plugin.init({
//     ...baseConf,
//     options: {
//       bucketName,
//       pathPrefix: "artifacts",
//       sse: true,
//     },
//     workingDirs: dirsB,
//   });
//   await plugin.fetch("abcdef12345");
// 
//   const list = glob.sync("dir_b/sample01.png", { cwd: dirsB.base });
//   assert.equal(list[0], "dir_b/sample01.png");
// 
//   await after(bucketName);
// }

async function main() {
  try {

    await case1();
    // await case2();

    console.log(" 🌟  Test was ended successfully! 🌟 ");
    process.exit(0);

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
