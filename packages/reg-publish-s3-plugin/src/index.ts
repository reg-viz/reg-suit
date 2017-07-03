import { PublisherPluginFactory } from "reg-suit-interface";
import { S3PublisherPlugin } from "./s3-publisher-plugin";
import { S3BucketPreparer } from "./s3-bucket-preparer";

const pluginFactory: PublisherPluginFactory = () => {
  return {
    preparer: new S3BucketPreparer(),
    publisher: new S3PublisherPlugin(),
  };
};

export = pluginFactory;
