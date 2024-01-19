import { PluginPreparer, PluginCreateOptions, PluginLogger } from "reg-suit-interface";
import { PluginConfig } from "./s3-publisher-plugin";

export interface SetupInquireResult {
  bucketName: string;
}

export class S3BucketPreparer implements PluginPreparer<SetupInquireResult, PluginConfig> {
  _logger!: PluginLogger;

  inquire() {
    return [
      {
        name: "bucketName",
        type: "input",
        message: "Bucket name",
      },
    ];
  }

  async prepare(config: PluginCreateOptions<SetupInquireResult>) {
    this._logger = config.logger;
    const { bucketName } = config.options;
    const pluginConfig: PluginConfig = {
      bucketName,
    };
    return pluginConfig;
  }
}
