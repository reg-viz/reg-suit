# reg-publish-gcs-plugin
reg-suit plugin to fetch and publish snapshot images to Google Cloud Storage.

## Install

```sh
npm i reg-publish-gcs-plugin -D
reg-suit prepare -p publish-gcs
```

## Authorizing GCP
This plugin to be authorized using GCP's [Application Default Credentials](https://cloud.google.com/docs/authentication/production).

If you run this plugin in your CI service, it to be recommended to create an Service Account. Visit https://cloud.google.com/iam/docs/creating-managing-service-accounts to see more details.


## Configure

```ts
{
  bucketName: string;
  pathPrefix?: string;
}
```

- `bucketName` - *Required* - GCS bucket name to publish the snapshot images to.
- `pathPrefix` - *Optional* - Specify paths. For example if you set `some_dir`, the report is published with URL such as `https://storage.googleapis.com/your-bucket/some_dir/xxxxxxxxxindex.html`.
