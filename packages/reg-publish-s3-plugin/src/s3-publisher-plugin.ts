import fs from "fs";
import path from "path";
import zlib from "zlib";
import {
  GetObjectCommand,
  GetObjectCommandOutput,
  ListObjectsV2Command,
  ListObjectsV2Output,
  ObjectCannedACL,
  PutObjectCommand,
  S3Client,
  S3ClientConfig,
  ServerSideEncryption,
} from "@aws-sdk/client-s3";
import mkdirp from "mkdirp";

import { PublisherPlugin, PluginCreateOptions, WorkingDirectoryInfo } from "reg-suit-interface";
import { FileItem, RemoteFileItem, ObjectListResult, AbstractPublisher } from "reg-suit-util";

export interface PluginConfig {
  bucketName: string;
  pattern?: string;
  enableACL?: boolean;
  acl?: ObjectCannedACL;
  sse?: boolean | ServerSideEncryption;
  sseKMSKeyId?: string;
  customDomain?: string;
  pathPrefix?: string;
  sdkOptions?: S3ClientConfig;
}

export class S3PublisherPlugin extends AbstractPublisher implements PublisherPlugin<PluginConfig> {
  name = "reg-publish-s3-plugin";

  private _options!: PluginCreateOptions<any>;
  private _pluginConfig!: PluginConfig;
  private _s3client!: S3Client;

  constructor() {
    super();
  }

  init(config: PluginCreateOptions<PluginConfig>) {
    this.noEmit = config.noEmit;
    this.logger = config.logger;
    this._options = config;
    this._pluginConfig = {
      ...config.options,
    };
    this._s3client = new S3Client(this._pluginConfig.sdkOptions ?? {});
  }

  publish(key: string) {
    return this.publishInternal(key).then(({ indexFile }) => {
      const reportUrl = indexFile && `https://${this.getBucketDomain()}/${this.resolveInBucket(key)}/${indexFile.path}`;
      return { reportUrl };
    });
  }

  fetch(key: string): Promise<any> {
    return this.fetchInternal(key);
  }

  protected getBucketDomain() {
    if (this._pluginConfig.customDomain) {
      return this._pluginConfig.customDomain;
    } else {
      return `${this._pluginConfig.bucketName}.s3.amazonaws.com`;
    }
  }

  protected getBucketRootDir(): string | undefined {
    return this._pluginConfig.pathPrefix;
  }

  protected getBucketName(): string {
    return this._pluginConfig.bucketName;
  }

  protected getLocalGlobPattern(): string | undefined {
    return this._pluginConfig.pattern;
  }

  protected getWorkingDirs(): WorkingDirectoryInfo {
    return this._options.workingDirs;
  }

  protected uploadItem(key: string, item: FileItem): Promise<FileItem> {
    return new Promise((resolve, reject) => {
      fs.readFile(item.absPath, (err, content) => {
        if (err) return reject(err);
        zlib.gzip(content, (err, data) => {
          if (err) return reject(err);

          // Enable ACL by default.
          if (this._pluginConfig.enableACL == undefined) {
            this._pluginConfig.enableACL = true;
          }
          const req = new PutObjectCommand({
            Bucket: this._pluginConfig.bucketName,
            Key: `${key}/${item.path}`,
            Body: data,
            ContentType: item.mimeType,
            ContentEncoding: "gzip",
            ACL: this._pluginConfig.enableACL ? this._pluginConfig.acl || ObjectCannedACL.public_read : undefined,
            SSEKMSKeyId: this._pluginConfig.sseKMSKeyId,
          });
          if (this._pluginConfig.sse) {
            const sseVal = this._pluginConfig.sse;
            req.input.ServerSideEncryption = typeof sseVal === "string" ? sseVal : ServerSideEncryption.AES256;
          }
          this._s3client
            .send(req)
            .then(() => {
              this.logger.verbose(`Uploaded from ${item.absPath} to ${key}/${item.path}`);
              return resolve(item);
            })
            .catch(err => {
              return reject(err);
            });
        });
      });
    });
  }

  protected downloadItem(remoteItem: RemoteFileItem, item: FileItem): Promise<FileItem> {
    const s3Key = remoteItem.remotePath;
    return new Promise((resolve, reject) => {
      this._s3client
        .send(
          new GetObjectCommand({
            Bucket: this._pluginConfig.bucketName,
            Key: `${s3Key}`,
          }),
        )
        .then((result: GetObjectCommandOutput) => {
          mkdirp.sync(path.dirname(item.absPath));
          this._gunzipIfNeed(result, (_err, content) => {
            if (_err) return reject(_err);
            fs.writeFile(item.absPath, content, err => {
              if (err) {
                return reject(err);
              }
              this.logger.verbose(`Downloaded from ${s3Key} to ${item.absPath}`);
              resolve(item);
            });
          });
        })
        .catch(err => {
          return reject(err);
        });
    });
  }

  protected listItems(lastKey: string, prefix: string): Promise<ObjectListResult> {
    interface S3ListObjectsOptions {
      Bucket: string;
      Prefix: string;
      MaxKeys: number;
      Marker?: string;
    }
    const options: S3ListObjectsOptions = {
      Bucket: this._pluginConfig.bucketName,
      Prefix: prefix,
      MaxKeys: 1000,
    };
    if (lastKey) {
      options.Marker = lastKey;
    }

    return new Promise<ObjectListResult>((resolve, reject) => {
      this._s3client
        .send(new ListObjectsV2Command(options))
        .then((result: ListObjectsV2Output) => {
          let nextMarker: string | undefined;
          if (result.Contents && result.Contents.length > 0 && result.IsTruncated) {
            nextMarker = result.Contents[result.Contents.length - 1].Key;
          }

          resolve({
            isTruncated: result.IsTruncated,
            contents: !result.Contents ? [] : result.Contents.map(f => ({ key: f.Key })),
            nextMarker,
          } as ObjectListResult);
        })
        .catch(err => reject(err));
    });
  }

  private _gunzipIfNeed(result: GetObjectCommandOutput, cb: (err: any, data: Buffer) => any) {
    if (!result.Body) {
      cb(new Error("No body returned!"), Buffer.from(""));
    }

    result
      .Body!.transformToByteArray()
      .then(body => {
        if (result.ContentEncoding === "gzip") {
          zlib.gunzip(Buffer.from(body), (err, content) => {
            cb(err, content);
          });
        } else {
          cb(null, Buffer.from(body));
        }
      })
      .catch(err => {
        cb(err, Buffer.from(""));
      });
  }
}
