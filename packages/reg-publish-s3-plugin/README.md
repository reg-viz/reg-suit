# reg-publish-s3-plugin

reg-suit plugin to fetch and publish snapshot images to AWS S3.

## Install

```sh
npm i reg-publish-s3-plugin -D
reg-suit prepare -p publish-s3
```

## AWS Credentials

This plugin needs AWS credentials to access S3. You can set them by the following 2 methods.

### Environment values

```sh
export AWS_ACCESS_KEY_ID=<your-access-key>
export AWS_SECRET_ACCESS_KEY=<your-secret-key>
```

### Create INI file

Create a file at `~/.aws/credentials` and edit it. For example:

```ini
[default]
aws_access_key_id = <your-access-key>
aws_secret_access_key = <your-secret-key>
```

## Configure

```ts
{
  bucketName: string;
  acl?: string;
  sse?: boolean | string;
  customDomain?: string;
  pathPrefix?: string;
  sdkOptions?: S3.Types.ClientConfiguration;
}
```

- `bucketName` - _Required_ - AWS S3 bucket name to publish the snapshot images to.
- `acl` - _Optional_ - Specify ACL property. By default, `public-read`.
- `sse` - _Optional_ - Specify server-side encryption property. Default `false`. If you set `true`, this plugin send with `--sse="AES256`.
- `customDomain` - _Optional_ - Set if you have your domain and host S3 on it. If set, the HTML report will be published with this custom domain(e.g. `https://your-sub.example.com/...`).
- `pathPrefix` - _Optional_ - Specify paths. For example if you set `some_dir`, the report is published with URL such as `https://your-backet-name.s3.amazonaws.com/some_dir/xxxxxxxxx/index.html`.
- `sdkOptions` - _Optional_ - Specify SDK options to pass to the S3 client. For details about the options, refer to the [AWS JavaScript SDK docs](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#constructor_details).

## IAM Role Policy

This plugin needs follwings role policy.

```
      "Action": [
        "s3:DeleteObject",
        "s3:GetObject",
        "s3:GetObjectAcl",
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:ListBucket"
      ]
```
