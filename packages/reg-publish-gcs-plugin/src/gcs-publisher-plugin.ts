import path from "path";
import * as mkdirp from "mkdirp";
import Gcs from "@google-cloud/storage"

import { WorkingDirectoryInfo, PublisherPlugin, PluginCreateOptions, PluginLogger } from "reg-suit-interface";
import { AbstractPublisher, RemoteFileItem, FileItem, ObjectListResult } from "reg-suit-util";

export interface PluginConfig {
  bucketName: string;
  pattern?: string;
  pathPrefix?: string;
}

export class GcsPublisherPlugin extends AbstractPublisher implements PublisherPlugin<PluginConfig> {
  name = "reg-publish-gcs-plugin";

  private _options!: PluginCreateOptions<any>;
  private _pluginConfig!: PluginConfig;
  private _gcsClient!: Gcs.Storage;

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
    this._gcsClient = Gcs();
  }

  publish(key: string) {
    return this.publishInteral(key).then(({ indexFile }) => {
      const reportUrl = indexFile && `https://storage.googleapis.com/${this.getBucketName()}/${this.resolveInBucket(key)}/${indexFile.path}`;
      return { reportUrl };
    });
  }

  fetch(key: string) {
    return this.fetchInternal(key);
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

  protected async uploadItem(key: string, item: FileItem) {
    await this._gcsClient.bucket(this._pluginConfig.bucketName).upload(item.absPath, {
      destination: `${key}/${item.path}`,
      gzip: true,
    });
    return item;
  }

  protected async downloadItem({ remotePath }: RemoteFileItem, item: FileItem) {
    mkdirp.sync(path.dirname(item.absPath));
    await this._gcsClient.bucket(this._pluginConfig.bucketName).file(remotePath).download({
      destination: item.absPath,
      validation: false,
    });
    return item;
  }

  protected async listItems(lastKey: string, prefix: string): Promise<ObjectListResult> {
    const files = await this._gcsClient.bucket(this._pluginConfig.bucketName).getFiles({
      prefix,
      maxResults: 1000,
      pageToken: lastKey,
    });
    return {
      isTruncated: files[0].length >= 1000,
      contents: files[0].map(f => ({ key: f.name })),
    };
  }
}
