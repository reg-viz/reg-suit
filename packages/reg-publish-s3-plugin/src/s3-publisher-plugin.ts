import * as fs from "fs";
import * as path from "path";
import * as zlib from "zlib";
import { S3, config as awsConfig } from "aws-sdk";
import * as glob from "glob";
import * as _ from "lodash";
import * as mkdirp from "mkdirp";
import { lookup } from "mime-types";
import { PublisherPlugin,
  PluginCreateOptions,
  PluginLogger
} from "reg-suit-interface";

export interface PluginConfig {
  bucketName: string;
  pattern?: string;
  acl?: string;
}

interface PluginConfigInternal extends PluginConfig {
  pattern: string;
}

export interface FileItem {
  path: string;
  absPath: string;
  mimeType: string;
}

const DEFAULT_PATTERN = "**/*.{html,js,wasm,png,json,jpeg,jpg,tiff,bmp,gif}";
const CONCURRENCY_SIZE = 50;

export class S3PublisherPlugin implements PublisherPlugin<PluginConfig> {

  name = "reg-publish-s3-plugin";

  _noEmit: boolean;
  private _logger: PluginLogger;
  private _options: PluginCreateOptions<any>;
  private _pluginConfig: PluginConfigInternal;
  private _s3client: S3;

  constructor() {
  }

  init(config: PluginCreateOptions<PluginConfig>) {
    this._options = config;
    this._pluginConfig = {
      pattern: DEFAULT_PATTERN,
      ...config.options,
    };
    this._s3client = new S3();
    this._noEmit = config.noEmit;
    this._logger = config.logger;
    this._checkCredentials();
  }

  createList(): Promise<FileItem[]> {
    return new Promise<string[]>((resolve, reject) => {
      glob(this._pluginConfig.pattern, {
        cwd: this._options.workingDirs.base,
      }, (err, list) => {
        if (err) {
          return reject(err);
        }
        resolve(list);
      });
    })
    .then(files => {
      return files.map(f => {
        const mimeType = lookup(f) || "unknown";
        return {
          path: f,
          absPath: path.resolve(this._options.workingDirs.base, f),
          mimeType,
        };
      })
      .filter(item => !!item.mimeType)
      ;
    })
    ;
  }

  publish(key: string) {
    return this._publishInternal(key).then(result => {
      return { reportUrl: result.reportUrl };
    });
  }

  fetch(key: string): Promise<any> {
    if (this._noEmit) return Promise.resolve();
    const actualPrefix = `${key}/${path.basename(this._options.workingDirs.actualDir)}`;
    const progress = this._logger.getProgressBar();
    return new Promise<S3.ListObjectsOutput>((resolve, reject) => {
      this._s3client.listObjects({
        Bucket: this._pluginConfig.bucketName,
        Prefix: actualPrefix,
        MaxKeys: 3000,
      }, (err, x) => {
        if (err) {
          return reject(err);
        }
        resolve(x);
      });
    })
    .then(result => result.Contents || [])
    .then(contents => {
      if (contents.length) {
        progress.start(contents.length, 0);
        this._logger.info(`Download ${contents.length} files from ${this._logger.colors.magenta(this._pluginConfig.bucketName)}.`);
      }
      return contents.map(c => {
        const suffix = c.Key ? c.Key.replace(new RegExp(`^${actualPrefix}\/`), "") : "";
        return {
          path: suffix,
          absPath: path.join(this._options.workingDirs.expectedDir, suffix),
          mimeType: lookup(suffix),
        } as FileItem;
      });
    })
    .then(items => _.chunk(items, CONCURRENCY_SIZE))
    .then(chunks => {
      return chunks.reduce((acc, chunk) => {
        return acc.then(list => {
          return Promise.all(chunk.map(item => {
            return this._fetchItem(key, item).then(fi => {
              progress.increment(1);
              return fi;
            });
          })).then(items => [...list, ...items]);
        });
      }, Promise.resolve([] as FileItem[]));
    }).then(result => {
      progress.stop();
      return result;
    })
    ;
  }

  _publishInternal(key: string) {
    const progress = this._logger.getProgressBar();
    return this.createList()
      .then(list => {
        if (list.length) {
          progress.start(list.length, 0);
          if (!this._noEmit) {
            this._logger.info(`Upload ${list.length} files to ${this._logger.colors.magenta(this._pluginConfig.bucketName)}.`);
          } else {
            this._logger.info(`There are ${list.length} files to publish`);
          }
        }
        return _.chunk(list, CONCURRENCY_SIZE);
      })
      .then(chunks => {
        return chunks.reduce((acc, chunk) => {
          return acc.then(list => {
            return Promise.all(chunk.map(item => {
              if (this._noEmit) return Promise.resolve(item);
              return this._publishItem(key, item).then(fi => {
                progress.increment(1);
                return fi;
              });
            })).then(items => [...list, ...items]);
          });
        }, Promise.resolve([] as FileItem[]));
      })
      .then(items => {
        const indexFile = items.find(item => item.path.endsWith("index.html"));
        const reportUrl = indexFile && `https://${this._pluginConfig.bucketName}.s3.amazonaws.com/${key}/${indexFile.path}`;
        return { reportUrl, items };
      })
      .then(result => {
        progress.stop();
        return result;
      })
    ;
  }

  private _checkCredentials() {
    if (!awsConfig.credentials || !awsConfig.credentials.accessKeyId || !awsConfig.credentials.secretAccessKey) {
      this._logger.error("Failed to read AWS credentials.");
      this._logger.error(`Create ${this._logger.colors.magenta("~/.aws/credentials")} or export ${this._logger.colors.green("$AWS_ACCESS_KEY_ID")} and ${this._logger.colors.green("$AWS_SECRET_ACCESS_KEY")}.`);
      throw new Error("AWS credentials are not set.");
    }
  }

  private _publishItem(key: string, item: FileItem): Promise<FileItem> {
    return new Promise((resolve, reject) => {
      fs.readFile(item.absPath, (err, content) => {
        if (err) return reject(err);
        zlib.gzip(content, (err, data) => {
          if (err) return reject(err);
          this._s3client.putObject({
            Bucket: this._pluginConfig.bucketName,
            Key: `${key}/${item.path}`,
            Body: data,
            ContentType: item.mimeType,
            ContentEncoding: "gzip",
            ACL: this.pluginConfig.acl || "public-read",
          }, (err, x) => {
            if (err) return reject(err);
            this._logger.verbose(`Uploaded from ${item.absPath} to ${key}/${item.path}`,);
            return resolve(item);
          });
        });
      });
    });
  }

  private _fetchItem(key: string, item: FileItem): Promise<FileItem> {
    const s3Key = `${key}/${path.basename(this._options.workingDirs.actualDir)}/${item.path}`;
    return new Promise((resolve, reject) => {
      this._s3client.getObject({
        Bucket: this._pluginConfig.bucketName,
        Key: `${s3Key}`,
      }, (err, x) => {
        if (err) {
          return reject(err);
        }
        mkdirp.sync(path.dirname(item.absPath));
        this._gunzipIfNeed(x, (err, content) => {
          fs.writeFile(item.absPath, content, (err) => {
            if (err) {
              return reject(err);
            }
            this._logger.verbose(`Downloaded from ${s3Key} to ${item.absPath}`);
            resolve(item);
          });
        });
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
