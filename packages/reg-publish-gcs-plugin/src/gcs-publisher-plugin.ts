import fs from "fs";
import path from "path";
import zlib from "zlib";
import { S3, config as awsConfig } from "aws-sdk";
import Gcs from "@google-cloud/storage"
import glob from "glob";
import * as _ from "lodash";
import * as mkdirp from "mkdirp";
import { lookup } from "mime-types";
import {
  PublisherPlugin,
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

export class GcsPublisherPlugin implements PublisherPlugin<PluginConfig> {

  name = "reg-publish-gcs-plugin";

  _noEmit!: boolean;
  private _logger!: PluginLogger;
  private _options!: PluginCreateOptions<any>;
  private _pluginConfig!: PluginConfigInternal;
  private _gcsClient!: Gcs.Storage;

  constructor() {
  }

  init(config: PluginCreateOptions<PluginConfig>) {
    this._options = config;
    this._pluginConfig = {
      pattern: DEFAULT_PATTERN,
      ...config.options,
    };
    this._gcsClient = Gcs({
      // projectId: this._pluginConfig.projectId,
    });
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
          result = await this._listObjectsPromise(nextMarker, actualPrefix);
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
        const reportUrl = indexFile && `https://storage.googleapis.com/${this._pluginConfig.bucketName}/${this._getPrefix(key)}/${indexFile.path}`;
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
    return this._gcsClient.bucket(this._pluginConfig.bucketName).upload(item.absPath, {
      destination: `${key}/${item.path}`,
      gzip: true,
    }).then(() => item);
  }

  private _fetchItem(key: string, item: FileItem): Promise<FileItem> {
    mkdirp.sync(path.dirname(item.absPath));
    const s3Key = `${key}/${path.basename(this._options.workingDirs.actualDir)}/${item.path}`;
    return this._gcsClient.bucket(this._pluginConfig.bucketName).file(s3Key).download({
      destination: item.absPath,
      validation: false,
    }).then(() => item);
  }

  private _listObjectsPromise(lastKey: string, prefix: string): Promise<S3.ListObjectsOutput> {
    return this._gcsClient.bucket(this._pluginConfig.bucketName).getFiles({
      prefix,
      maxResults: 1000,
      pageToken: lastKey,
    }).then(files => {
      return {
        IsTruncated: files[0].length >= 1000,
        Contents: files[0].map(f => {
          return {
            Key: f.name,
          } as S3.Object;
        })
      } as S3.ListObjectsOutput
    });
  }
}
