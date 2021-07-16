import path from "path";
import mkdirp from "mkdirp";
import { Storage, GetFilesOptions } from "@google-cloud/storage";

import { WorkingDirectoryInfo, PublisherPlugin, PluginCreateOptions, ProjectConfig } from "reg-suit-interface";
import { AbstractPublisher, RemoteFileItem, FileItem, ObjectListResult } from "reg-suit-util";

export interface PluginConfig {
  bucketName: string;
  pattern?: string;
  customUri?: string;
  pathPrefix?: string;
}

export class GcsPublisherPlugin extends AbstractPublisher implements PublisherPlugin<PluginConfig> {
  name = "reg-publish-gcs-plugin";

  private _options!: PluginCreateOptions<any>;
  private _projectOptions!: ProjectConfig;
  private _pluginConfig!: PluginConfig;
  private _gcsClient!: Storage;

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
    this._gcsClient = new Storage();
  }

  async publish(key: string) {
    const { indexFile } = await this.publishInternal(key);
    const reportUrl = indexFile && `${this.getUriPrefix()}/${this.resolveInBucket(key)}/${indexFile.path}`;
    return { reportUrl };
  }

  async fetch(key: string) {
    return this.fetchInternal(key);
  }

  protected getUriPrefix() {
    const { customUri } = this._pluginConfig;
    if (customUri) {
      return customUri.endsWith("/") ? customUri.slice(0, customUri.length - 1) : customUri;
    } else {
      return `https://storage.googleapis.com/${this.getBucketName()}`;
    }
  }

  protected getBucketRootDir(): string | undefined {
    return this._pluginConfig.pathPrefix;
  }

  protected getBucketName(): string {
    return this._pluginConfig.bucketName;
  }

  protected getProjectName(): string | undefined {
    return this._projectOptions.name;
  }

  protected getLocalGlobPattern(): string | undefined {
    return this._pluginConfig.pattern;
  }

  protected getWorkingDirs(): WorkingDirectoryInfo {
    return this._options.workingDirs;
  }

  protected async uploadItem(key: string, item: FileItem) {
    await this._gcsClient.bucket(this._pluginConfig.bucketName).upload(item.absPath, {
      destination: `${key}/${item.path}`,
      gzip: true,
    });
    this.logger.verbose(`Uploaded from ${item.absPath} to ${key}/${item.path}`);
    return item;
  }

  protected async downloadItem({ remotePath }: RemoteFileItem, item: FileItem) {
    mkdirp.sync(path.dirname(item.absPath));
    await this._gcsClient.bucket(this._pluginConfig.bucketName).file(remotePath).download({
      destination: item.absPath,
      validation: false,
    });
    this.logger.verbose(`Downloaded from ${remotePath} to ${item.absPath}`);
    return item;
  }

  protected async listItems(lastKey: string, prefix: string): Promise<ObjectListResult> {
    return new Promise<ObjectListResult>((resolve, reject) => {
      this._gcsClient.bucket(this._pluginConfig.bucketName).getFiles(
        {
          prefix,
          maxResults: 1000,
          pageToken: lastKey,
        },
        (err, files, nextQuery) => {
          if (err) {
            reject(err);
          }

          const nextMarker = nextQuery && (nextQuery as GetFilesOptions).pageToken;

          resolve({
            isTruncated: nextMarker != null,
            contents: !files ? [] : files.map(f => ({ key: f.name })),
            nextMarker: nextMarker,
          } as ObjectListResult);
        },
      );
    });
  }
}
