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
}
```

- `bucketName` - *Required* - AWS S3 bucket name to publish the snapshot images to.
- `acl` - *Optional* - Specify ACL property. By default, `public-read`.
- `sse` - *Optional* - Specify server-side encryption property. Default `false`. If you set `true`, this plugin send with `--sse="AES256`.
