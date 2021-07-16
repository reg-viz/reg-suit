import path from "path";
import { PluginLogger, WorkingDirectoryInfo } from "reg-suit-interface";

import { lookup } from "mime-types";
import glob from "glob";
import _ from "lodash";

export type FileItem = {
  path: string;
  absPath: string;
  mimeType: string;
};

export type RemoteFileItem = {
  key: string;
  remotePath: string;
};

export type ObjectMetadata = {
  key: string;
};

export type ObjectListResult = {
  isTruncated: boolean;
  contents: ObjectMetadata[];
  nextMarker?: string;
};

const CONCURRENCY_SIZE = 50;
const DEFAULT_PATTERN = "**/*.{html,js,wasm,png,json,jpeg,jpg,tiff,bmp,gif}";

export abstract class AbstractPublisher {
  protected noEmit = false;
  protected logger!: PluginLogger;

  protected abstract uploadItem(key: string, item: FileItem): Promise<FileItem>;
  protected abstract downloadItem(remoteItem: RemoteFileItem, item: FileItem): Promise<FileItem>;
  protected abstract listItems(lastKey: string, prefix: string): Promise<ObjectListResult>;
  protected abstract getWorkingDirs(): WorkingDirectoryInfo;
  protected abstract getLocalGlobPattern(): string | undefined;
  protected abstract getBucketName(): string;
  protected abstract getBucketRootDir(): string | undefined;
  protected abstract getProjectName(): string | undefined;

  protected createList(): Promise<FileItem[]> {
    return new Promise<string[]>((resolve, reject) => {
      glob(
        this.getLocalGlobPattern() || DEFAULT_PATTERN,
        {
          cwd: this.getWorkingDirs().base,
          nodir: true,
        },
        (err, list) => {
          if (err) {
            return reject(err);
          }
          resolve(list);
        },
      );
    }).then(files => {
      return files
        .map(f => {
          const mimeType = lookup(f) || "unknown";
          return {
            path: f,
            absPath: path.resolve(this.getWorkingDirs().base, f),
            mimeType,
          };
        })
        .filter(item => !!item.mimeType);
    });
  }

  protected resolveInBucket(key: string) {
    if (this.getBucketRootDir() && !this.getProjectName()) {
      return this.getBucketRootDir() + "/" + key;
    }

    if (this.getBucketRootDir() && this.getProjectName()) {
      return this.getBucketRootDir() + "/" + this.getProjectName() + "/" + key;
    }

    if (!this.getBucketRootDir() && this.getProjectName()) {
      return this.getProjectName() + "/" + key;
    }

    return key;
  }

  protected fetchInternal(key: string): Promise<any> {
    if (this.noEmit) return Promise.resolve();
    const actualPrefix = `${this.resolveInBucket(key)}/${path.basename(this.getWorkingDirs().actualDir)}`;
    const progress = this.logger.getProgressBar();
    return new Promise<ObjectMetadata[]>(async (resolve, reject) => {
      const contents = [] as ObjectMetadata[];
      let isTruncated: boolean = true;
      let nextMarker: string = "";

      const maxLoop = 3;
      let loop = 0;
      while (isTruncated && loop < maxLoop) {
        let result: ObjectListResult;
        try {
          result = await this.listItems(nextMarker, actualPrefix);
          const curContents = result.contents || [];
          if (curContents.length > 0) {
            Array.prototype.push.apply(contents, curContents);
          }
          if (result.nextMarker) {
            nextMarker = result.nextMarker;
          }
          isTruncated = result.isTruncated || false;
        } catch (e) {
          reject(e);
        }
        loop += 1;
      }
      resolve(contents);
    })
      .then(contents => {
        if (contents.length) {
          progress.start(contents.length, 0);
          this.logger.info(
            `Download ${contents.length} files from ${this.logger.colors.magenta(this.getBucketName())}.`,
          );
        }
        return contents.map(c => {
          const suffix = c.key ? c.key.replace(new RegExp(`^${actualPrefix}\/`), "") : "";
          return {
            path: suffix,
            absPath: path.join(this.getWorkingDirs().expectedDir, suffix),
            mimeType: lookup(suffix),
          } as FileItem;
        });
      })
      .then(items => _.chunk(items, CONCURRENCY_SIZE))
      .then(chunks => {
        return chunks.reduce((acc, chunk) => {
          return acc.then(list => {
            return Promise.all(
              chunk.map(item => {
                const remotePath = `${this.resolveInBucket(key)}/${path.basename(this.getWorkingDirs().actualDir)}/${
                  item.path
                }`;
                return this.downloadItem({ remotePath, key }, item).then(fi => {
                  progress.increment(1);
                  return fi;
                });
              }),
            ).then(items => [...list, ...items]);
          });
        }, Promise.resolve([] as FileItem[]));
      })
      .then(result => {
        progress.stop();
        return result;
      });
  }

  protected publishInternal(key: string) {
    const progress = this.logger.getProgressBar();
    return this.createList()
      .then(list => {
        if (list.length) {
          progress.start(list.length, 0);
          if (!this.noEmit) {
            this.logger.info(`Upload ${list.length} files to ${this.logger.colors.magenta(this.getBucketName())}.`);
          } else {
            this.logger.info(`There are ${list.length} files to publish`);
          }
        }
        return _.chunk(list, CONCURRENCY_SIZE);
      })
      .then(chunks => {
        return chunks.reduce((acc, chunk) => {
          return acc.then(list => {
            return Promise.all(
              chunk.map(item => {
                if (this.noEmit) return Promise.resolve(item);
                return this.uploadItem(this.resolveInBucket(key), item).then(fi => {
                  progress.increment(1);
                  return fi;
                });
              }),
            ).then(items => [...list, ...items]);
          });
        }, Promise.resolve([] as FileItem[]));
      })
      .then(items => {
        const indexFile = items.find(item => item.path.endsWith("index.html"));
        return { items, indexFile };
      })
      .then(result => {
        progress.stop();
        return result;
      });
  }
}
