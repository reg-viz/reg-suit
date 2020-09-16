import { v4 as uuid } from "uuid";
import { S3, config as awsConfig } from "aws-sdk";
import { PluginPreparer, PluginCreateOptions, PluginLogger } from "reg-suit-interface";
import { PluginConfig } from "./s3-publisher-plugin";

export interface SetupInquireResult {
  createBucket: boolean;
  bucketName?: string;
}

function createPolicy(bucketName: string) {
  return {
    Version: "2012-10-17",
    Id: "Policy1498486961145",
    Statement: [
      {
        Sid: "Stmt1498486956732",
        Effect: "Allow",
        Principal: "*",
        Action: "s3:GetObject",
        Resource: `arn:aws:s3:::${bucketName}/*`,
      },
    ],
  };
}

const BUCKET_PREFIX = "reg-publish-bucket";

export class S3BucketPreparer implements PluginPreparer<SetupInquireResult, PluginConfig> {
  private _s3client = new S3();
  _logger!: PluginLogger;

  inquire() {
    return [
      {
        name: "createBucket",
        type: "confirm",
        message: "Create a new S3 bucket",
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
        bucketName: ir.bucketName as string,
      });
    } else {
      const id = uuid();
      const bucketName = `${BUCKET_PREFIX}-${id}`;
      if (!awsConfig.credentials || !awsConfig.credentials.accessKeyId) {
        this._logger.warn("Failed to read AWS credentials.");
        this._logger.warn(
          `Create ${this._logger.colors.magenta("~/.aws/credentials")} or export ${this._logger.colors.green(
            "$AWS_ACCESS_KEY_ID",
          )} and ${this._logger.colors.green("$AWS_SECRET_ACCESS_KEY")}.`,
        );
        return Promise.resolve({ bucketName: "your_s3_bucket_name" });
      }
      if (config.noEmit) {
        this._logger.info(`Skip to create S3 bucket ${bucketName} because noEmit option.`);
        return Promise.resolve({ bucketName });
      }
      this._logger.info(`Create new S3 bucket: ${this._logger.colors.magenta(bucketName)}`);
      const spinner = this._logger.getSpinner(`creating bucket...`);
      spinner.start();
      return this._createBucket(bucketName)
        .then(bucketName => {
          return this._updatePolicy(bucketName);
        })
        .then(bucketName => {
          spinner.stop();
          return { bucketName };
        });
    }
  }

  _updatePolicy(bucketName: string) {
    return new Promise<string>((resolve, reject) => {
      this._s3client.putBucketPolicy(
        {
          Bucket: bucketName,
          Policy: JSON.stringify(createPolicy(bucketName)),
        },
        err => {
          if (err) {
            return reject(err);
          }
          resolve(bucketName);
        },
      );
    });
  }

  _createBucket(bucketName: string) {
    return new Promise<string>((resolve, reject) => {
      this._s3client.createBucket(
        {
          Bucket: bucketName,
        },
        err => {
          if (err) {
            return reject(err);
          }
          return resolve(bucketName);
        },
      );
    });
  }
}
