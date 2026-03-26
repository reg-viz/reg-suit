# reg-publish-gcs-plugin

reg-suit plugin to fetch and publish snapshot images to Google Cloud Storage.

## Install

```sh
npm i reg-publish-gcs-plugin -D
reg-suit prepare -p publish-gcs
```

## Authorizing GCP

This plugin has to be authorized using GCP's [Application Default Credentials](https://cloud.google.com/docs/authentication/production).

If you run this plugin in your CI service, it's recommended to create a Service Account. Visit https://cloud.google.com/iam/docs/creating-managing-service-accounts to see more details.

## Configure

```ts
{
  bucketName: string;
  customUri?: string;
  pathPrefix?: string;
  uncompressed?: boolean;
}
```

- `bucketName` - _Required_ - GCS bucket name to publish the snapshot images to.
- `customUri` - _Optional_ - Custom URI prefix. Default value is `https://storage.googleapis.com/${bucketName}`. It's useful if you request report HTML over some HTTP proxy servers.
- `pathPrefix` - _Optional_ - Specify paths. For example if you set `some_dir`, the report is published with URL such as `https://storage.googleapis.com/your-bucket/some_dir/xxxxxxxxxindex.html`.
- `uncompressed` - _Optional_ - If you want to upload files to GCS without [gzip transcording](https://cloud.google.com/storage/docs/transcoding), specify this property as `true`. When this property is `false` or `undefined`, all files are uploaded with gzip transcording.
  - If you try to build a private static website built by `vrt-suit` with [nginx on Cloud Run mounted GCS](https://cloud.google.com/blog/en/products/serverless/introducing-cloud-run-volume-mounts?hl=en), it's better to set the flag as `true` for the following constraint.
    - GCS mount uses [gcsfuse](https://cloud.google.com/storage/docs/gcs-fuse?hl=ja) in the background. This tool doesn't undergo decompressive transcoding, so if you upload files with gzip transcoding, nginx delivers the files without decompressive transcoding(i.e., delivers contents compressed by gzip) and without response header `Content-Encoding: gzip`. It means that web browsers can't properly display `index.html` to users.
