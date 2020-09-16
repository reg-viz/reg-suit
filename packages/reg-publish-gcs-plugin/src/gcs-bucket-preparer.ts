import { v4 as uuid } from "uuid";
import { PluginPreparer, PluginCreateOptions, PluginLogger } from "reg-suit-interface";
import { PluginConfig } from "./gcs-publisher-plugin";
import { Storage } from "@google-cloud/storage";

export interface SetupInquireResult {
  // projectId: string;
  createBucket: boolean;
  bucketName?: string;
}

const BUCKET_PREFIX = "reg-publish-bucket";

export class GcsBucketPreparer implements PluginPreparer<SetupInquireResult, PluginConfig> {
  _logger!: PluginLogger;

  inquire() {
    return [
      // {
      //   name: "projectId",
      //   type: "input",
      //   message: "Which GCP project id",
      // },
      {
        name: "createBucket",
        type: "confirm",
        message: "Create a new GCS bucket",
        default: true,
      },
      {
        name: "bucketName",
        type: "input",
        message: "Existing bucket name",
        when: (ctx: any) => !(ctx as { createBucket: boolean }).createBucket,
      },
    ];
  }

  prepare(config: PluginCreateOptions<SetupInquireResult>) {
    this._logger = config.logger;
    const ir = config.options;
    if (!ir.createBucket) {
      return Promise.resolve({
        // projectId: ir.projectId as string,
        bucketName: ir.bucketName as string,
      });
    } else {
      const id = uuid();
      const bucketName = `${BUCKET_PREFIX}-${id}`;
      if (config.noEmit) {
        this._logger.info(`Skip to create GCS bucket ${bucketName} because noEmit option.`);
        return Promise.resolve({ bucketName });
      }
      this._logger.info(`Create new GCS bucket: ${this._logger.colors.magenta(bucketName)}`);
      const spinner = this._logger.getSpinner(`creating bucket...`);
      spinner.start();
      return this._createBucket(bucketName).then(bucket => {
        spinner.stop();
        return { bucketName: bucket.name };
      });
    }
  }

  async _createBucket(bucketName: string) {
    const bucket = new Storage().bucket(bucketName);
    await bucket.create({
      coldline: true,
    });
    await bucket.acl.default.add({
      entity: "allUsers",
      role: "READER",
    });
    return bucket;
  }
}
