import { S3 } from "aws-sdk";
import * as uuid from "uuid/v4";
import { PluginPreparer, PluginCreateOptions } from "reg-suit-core/lib/core";
import { PluginConfig } from "./s3-publisher";

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

  inquire(opt: any) {
    // TODO
    return Promise.reject<SetupInquireResult>(null);
  }

  prepare(config: PluginCreateOptions<SetupInquireResult>) {
    const ir = config.options;
    if (!ir.createBucket) {
      return Promise.resolve({
        bucketName: ir.bucketName,
      });
    } else  {
      const id = uuid();
      const bucketName = `${BUCKET_PREFIX}-${id}`;
      return this._createBucket(bucketName)
      .then(bucketName => {
        return this._updatePolicy(bucketName);
      }).then(bucketName => {
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
