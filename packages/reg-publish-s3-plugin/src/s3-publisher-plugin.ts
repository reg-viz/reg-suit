import fs from "fs";
import path from "path";
import zlib from "zlib";
import { S3 } from "aws-sdk";
import mkdirp from "mkdirp";

import { PublisherPlugin, PluginCreateOptions, WorkingDirectoryInfo, ProjectConfig } from "reg-suit-interface";
import { FileItem, RemoteFileItem, ObjectListResult, AbstractPublisher } from "reg-suit-util";

export interface PluginConfig {
  bucketName: string;
  pattern?: string;
  acl?: string;
  sse?: boolean | string;
  customDomain?: string;
  pathPrefix?: string;
  sdkOptions?: S3.Types.ClientConfiguration;
}

export class S3PublisherPlugin extends AbstractPublisher implements PublisherPlugin<PluginConfig> {
  name = "reg-publish-s3-plugin";

  private _options!: PluginCreateOptions<any>;
  private _projectOptions!: ProjectConfig;
  private _pluginConfig!: PluginConfig;
  private _s3client!: S3;

  constructor() {
    super();
  }

  init(config: PluginCreateOptions<PluginConfig>) {
    this.noEmit = config.noEmit;
    this.logger = config.logger;
    this._projectOptions = config.projectConfig;
    this._options = config;
    this._pluginConfig = {
      ...config.options,
    };
    this._s3client = new S3(this._pluginConfig.sdkOptions);
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

  protected getProjectName(): string | undefined {
    return this._projectOptions.name;
  }

  protected uploadItem(key: string, item: FileItem): Promise<FileItem> {
    return new Promise((resolve, reject) => {
      fs.readFile(item.absPath, (err, content) => {
        if (err) return reject(err);
        zlib.gzip(content, (err, data) => {
          if (err) return reject(err);
          const req = {
            Bucket: this._pluginConfig.bucketName,
            Key: `${key}/${item.path}`,
            Body: data,
            ContentType: item.mimeType,
            ContentEncoding: "gzip",
            ACL: this._pluginConfig.acl || "public-read",
          } as S3.Types.PutObjectRequest;
          if (this._pluginConfig.sse) {
            const sseVal = this._pluginConfig.sse;
            req.ServerSideEncryption = typeof sseVal === "string" ? sseVal : "AES256";
          }
          this._s3client.putObject(req, err => {
            if (err) return reject(err);
            this.logger.verbose(`Uploaded from ${item.absPath} to ${key}/${item.path}`);
            return resolve(item);
          });
        });
      });
    });
  }

  protected downloadItem(remoteItem: RemoteFileItem, item: FileItem): Promise<FileItem> {
    const s3Key = remoteItem.remotePath;
    return new Promise((resolve, reject) => {
      this._s3client.getObject(
        {
          Bucket: this._pluginConfig.bucketName,
          Key: `${s3Key}`,
        },
        (err, x) => {
          if (err) {
            return reject(err);
          }
          mkdirp.sync(path.dirname(item.absPath));
          this._gunzipIfNeed(x, (_err, content) => {
            fs.writeFile(item.absPath, content, err => {
              if (err) {
                return reject(err);
              }
              this.logger.verbose(`Downloaded from ${s3Key} to ${item.absPath}`);
              resolve(item);
            });
          });
        },
      );
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
      this._s3client.listObjects(options, async (err, result: S3.ListObjectsOutput) => {
        if (err) {
          reject(err);
        }

        let nextMarker: string | undefined;
        if (result.Contents && result.Contents.length > 0 && result.IsTruncated) {
          nextMarker = result.Contents[result.Contents.length - 1].Key;
        }

        resolve({
          isTruncated: result.IsTruncated,
          contents: !result.Contents ? [] : result.Contents.map(f => ({ key: f.Key })),
          nextMarker,
        } as ObjectListResult);
      });
    });
  }

  private _gunzipIfNeed(output: S3.GetObjectOutput, cb: (err: any, data: Buffer) => any) {
    if (output.ContentEncoding === "gzip") {
      zlib.gunzip(output.Body as Buffer, (err, content) => {
        cb(err, content);
      });
    } else {
      cb(null, output.Body as Buffer);
    }
  }
}
