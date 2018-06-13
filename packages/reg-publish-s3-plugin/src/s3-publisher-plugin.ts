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
  sse?: boolean | string;
  pathPrefix?: string;
}

interface PluginConfigInternal extends PluginConfig {
  pattern: string;
}

interface S3ListObjectContent {
  Key?: string;
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
    const actualPrefix = `${this._getPrefix(key)}/${path.basename(this._options.workingDirs.actualDir)}`;
    const progress = this._logger.getProgressBar();
    return new Promise<S3ListObjectContent []>(async (resolve, reject) => {
      let contents: S3ListObjectContent [] = []
      let isTruncated: boolean = true
      let nextMarker: string = ''

      const maxLoop = 3
      let loop = 0
      while (isTruncated && loop < maxLoop) {
        let result: S3.ListObjectsOutput;
        try {
          result = await this._listObjectsPromise(nextMarker, actualPrefix)
          let curContents = result.Contents || []
          if (curContents.length > 0) {
            nextMarker = curContents[curContents.length - 1].Key || ''
            Array.prototype.push.apply(contents, curContents)
          }
          isTruncated = result.IsTruncated || false;
        } catch(e) {
          reject(e)
        }
        loop += 1
      }
      resolve(contents)
    })
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
            return this._fetchItem(this._getPrefix(key), item).then(fi => {
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
              return this._publishItem(this._getPrefix(key), item).then(fi => {
                progress.increment(1);
                return fi;
              });
            })).then(items => [...list, ...items]);
          });
        }, Promise.resolve([] as FileItem[]));
      })
      .then(items => {
        const indexFile = items.find(item => item.path.endsWith("index.html"));
        const reportUrl = indexFile && `https://${this._pluginConfig.bucketName}.s3.amazonaws.com/${this._getPrefix(key)}/${indexFile.path}`;
        return { reportUrl, items };
      })
      .then(result => {
        progress.stop();
        return result;
      })
    ;
  }

  private _getPrefix(key: string) {
    if (this._pluginConfig.pathPrefix && this._pluginConfig.pathPrefix.length) {
      return this._pluginConfig.pathPrefix + "/" + key;
    } else {
      return key;
    }
  }

  private _publishItem(key: string, item: FileItem): Promise<FileItem> {
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
          this._s3client.putObject(req, (err, x) => {
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

  private _listObjectsPromise(lastKey: string, prefix: string): Promise<S3.ListObjectsOutput> {
    interface S3ListObjectsOptions {
      Bucket: string;
      Prefix: string;
      MaxKeys: number;
      Marker?: string;
    }
    let options: S3ListObjectsOptions = {
      Bucket: this._pluginConfig.bucketName,
      Prefix: prefix,
      MaxKeys: 1000,
    }
    if (lastKey) {
        options.Marker = lastKey
    }

    return new Promise<S3.ListObjectsOutput>((resolve, reject) => {
      this._s3client.listObjects(options, async (err, result: S3.ListObjectsOutput) => {
        if (err) {
          reject(err)
        }
        resolve(result)
      })
    })
  }
}
