import { S3 } from "aws-sdk";
import * as uuid from "uuid/v4";
import { PluginPreparer, PluginCreateOptions, PreparerQuestions, PluginLogger } from "reg-suit-core/lib/plugin";
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
      }
    ]
  };
}

const BUCKET_PREFIX = "reg-publish-bucket";

export class S3BucketPreparer implements PluginPreparer<SetupInquireResult, PluginConfig> {
  private _s3client = new S3();
  _logger: PluginLogger;

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
        when: (ctx: { createBucket: boolean }) => !ctx.createBucket,
      },
    ];
  }

  prepare(config: PluginCreateOptions<SetupInquireResult>) {
    this._logger = config.logger;
    const ir = config.options;
    if (!ir.createBucket) {
      return Promise.resolve({
        bucketName: ir.bucketName,
      });
    } else  {
      const id = uuid();
      const bucketName = `${BUCKET_PREFIX}-${id}`;
      if (config.noEmit) {
        this._logger.info("Skip create S3 bucket because noEmit option.");
        return Promise.resolve({ bucketName });
      }
      return this._createBucket(bucketName)
      .then(bucketName => {
        return this._updatePolicy(bucketName);
      }).then(bucketName => {
        this._logger.info(`Create new S3 bucket: ${bucketName}`);
        return { bucketName };
      })
    }
  }

  _updatePolicy(bucketName: string) {
    return new Promise<string>((resolve, reject) => {
      this._s3client.putBucketPolicy({
        Bucket: bucketName,
        Policy: JSON.stringify(createPolicy(bucketName)),
      }, (err, x) => {
        if (err) {
          return reject(err);
        }
        resolve(bucketName);
      });
    });
  }

  _createBucket(bucketName: string) {
    return new Promise<string>((resolve, reject) => {
      this._s3client.createBucket({
        Bucket: bucketName,
      }, (err, x) => {
        if (err) {
          return reject(err);
        }
        return resolve(bucketName);
      });
    });
  }
  
}
