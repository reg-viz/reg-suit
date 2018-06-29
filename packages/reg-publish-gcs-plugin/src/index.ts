import { PublisherPluginFactory } from "reg-suit-interface";
import { GcsPublisherPlugin } from "./gcs-publisher-plugin";
import { GcsBucketPreparer } from "./gcs-bucket-preparer";

const pluginFactory: PublisherPluginFactory = () => {
  return {
    preparer: new GcsBucketPreparer(),
    publisher: new GcsPublisherPlugin(),
  };
};

export = pluginFactory;
