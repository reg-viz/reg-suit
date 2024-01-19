# reg-publish-s3-plugin

reg-suit plugin to fetch and publish snapshot images to AWS S3.

## Install

```sh
npm i reg-publish-s3-plugin -D
reg-suit prepare -p publish-s3
```

## Requirements

To use this plugin, you need to create an S3 bucket and configure to allow to access it from your CI.

## Configure

```ts
{
  bucketName: string;
  acl?: string;
  sse?: boolean | string;
  sseKMSKeyId?: string;
  customDomain?: string;
  pathPrefix?: string;
  sdkOptions?: S3ClientConfig;
}
```

- `bucketName` - _Required_ - AWS S3 bucket name to publish the snapshot images to.
- `enableACL` - _Optional_ - Specifies whether ACL is enabled or not. Default `true`.
- `acl` - _Optional_ - Specify ACL property. By default, `public-read`.
- `sse` - _Optional_ - Specify server-side encryption property. Default `false`. If you set `true`, this plugin send with `--sse="AES256`.
- `sseKMSKeyId` - _Optional_ - Specify server-side encryption KMS KEY ID. If provided, is passed as SSEKMSKeyId to s3.putObject.
- `customDomain` - _Optional_ - Set if you have your domain and host S3 on it. If set, the HTML report will be published with this custom domain(e.g. `https://your-sub.example.com/...`).
- `pathPrefix` - _Optional_ - Specify paths. For example if you set `some_dir`, the report is published with URL such as `https://your-backet-name.s3.amazonaws.com/some_dir/xxxxxxxxx/index.html`.
- `sdkOptions` - _Optional_ - Specify options to pass to `S3Client` constructor. For details about the options, refer to the [AWS JavaScript SDK docs](https://www.npmjs.com/package/@aws-sdk/client-s3#usage).

## IAM Role Policy

This plugin needs following role policy.

```
  "Action": [
    "s3:DeleteObject",
    "s3:GetObject",
    "s3:GetObjectAcl",
    "s3:PutObject",
    "s3:PutObjectAcl",
    "s3:ListObject"
  ]
```
