import * as fs from "fs";
import * as path from "path";
import { S3 } from "aws-sdk";
import * as glob from "glob";
import * as _ from "lodash";
import * as mkdirp from "mkdirp";
import { lookup } from "mime-types";
import { PublisherPlugin, PluginCreateOptions } from "reg-suit-core/lib/core";

export interface PluginConfig {
  bucketName: string;
  pattern?: string;
}

interface PluginConfigInternal extends PluginConfig {
  pattern: string;
}

export interface FileItem {
  path: string;
  absPath: string;
  mimeType: string;
}

const DEFAULT_PATTERN = "**/*.{html,png,json}";
const CONCURRENCY_SIZE = 20;

export class S3PublisherPlugin implements PublisherPlugin<PluginConfig> {

  name = "reg-publish-s3-plugin";

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
  }

  createList(): Promise<FileItem[]> {
    return new Promise<string[]>((resolve, reject) => {
      glob(this._pluginConfig.pattern, {
        cwd: this._options.coreConfig.workingDir,
      }, (err, list) => {
        if (err) {
          return reject(err);
        }
        resolve(list);
      });
    })
    .then(files => {
      return files.map(f => {
        return {
          path: f,
          absPath: path.resolve(this._options.coreConfig.workingDir, f),
          mimeType: lookup(f),
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
    return new Promise<S3.ListObjectsOutput>((resolve, reject) => {
      this._s3client.listObjects({
        Bucket: this._pluginConfig.bucketName,
        Prefix: `${key}/${this._options.coreConfig.actualDir}`,
        MaxKeys: 3000,
      }, (err, x) => {
        if (err) {
          return reject(err);
        }
        resolve(x);
      })
    })
    .then(result => result.Contents || [])
    .then(contents => {
      return contents.map(c => {
        const suffix = c.Key ? c.Key.replace(new RegExp(`^${key}\/${this._options.coreConfig.actualDir}\/`), "") : "";
        return {
          path: suffix,
          absPath: path.join(path.resolve(this._options.coreConfig.workingDir, this._options.coreConfig.expectedDir), suffix),
          mimeType: lookup(suffix),
        } as FileItem;
      });
    })
    .then(items => _.chunk(items, CONCURRENCY_SIZE))
    .then(chunks => {
      return chunks.reduce((acc, chunk) => {
        return acc.then(list => {
          return Promise.all(chunk.map(item => {
            return this._fetchItem(key, item);
          })).then(items => [...list, ...items]);
        });
      }, Promise.resolve([] as FileItem[]))
    })
    ;
  }

  _publishInternal(key: string) {
    return this.createList()
      .then(list => _.chunk(list, CONCURRENCY_SIZE))
      .then(chunks => {
        return chunks.reduce((acc, chunk) => {
          return acc.then(list => {
            return Promise.all(chunk.map(item => {
              return this._publishItem(key, item);
            })).then(items => [...list, ...items]);
          });
        }, Promise.resolve([] as FileItem[]));
      })
      .then(items => {
        const indexFile = items.find(item => item.path.endsWith("index.html"));
        return {
          // FIXME is this naming rule correct?
          reportUrl: indexFile && `https://s3.amazonaws.com/${this._pluginConfig.bucketName}/${key}/${indexFile.path}`,
          items,
        };
      })
    ;
  }

  private _publishItem(key: string, item: FileItem): Promise<FileItem> {
    return new Promise((resolve, reject) => {
      fs.readFile(item.absPath, (err, data) => {
        if (err) return reject(err);
        this._s3client.putObject({
          Bucket: this._pluginConfig.bucketName,
          Key: `${key}/${item.path}`,
          Body: data,
          ContentType: item.mimeType,
        }, (err, x) => {
          if (err) return reject(err);
          return resolve(item);
        });
      });
    });
  }

  private _fetchItem(key: string, item: FileItem): Promise<FileItem> {
    return new Promise((resolve, reject) => {
      this._s3client.getObject({
        Bucket: this._pluginConfig.bucketName,
        Key: `${key}/${this._options.coreConfig.actualDir}/${item.path}`
      }, (err, x) => {
        if (err) {
          return reject(err);
        }
        mkdirp.sync(path.dirname(item.absPath));
        fs.writeFile(item.absPath, x.Body, (err) => {
          if (err) {
            return reject(err);
          }
          resolve(item);
        });
      });
    });
  }
}
