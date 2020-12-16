# reg-notify-chatwork-plugin

A reg-suit plugin to send notification the testing result to chatwork channel.

## Install

```sh
npm i reg-notify-chatwork-plugin
reg-suit prepare -p notify-chatwork
```

## Configure

```ts
{
  chatworkToken: string;
  roomID: string;
  mrURL: string;
  mention: string;
  pipelineURL: string;
}
```

- `chatworkToken` - _Required_ - The API token of chatwork account sending message your chatwork channel. [Chatwork API Token](https://www.chatwork.com/service/packages/chatwork/subpackages/api/token.php)
- `roomID` - _Required_ - The room id of your chatwork channel.
- `mrURL` - _Optional_ - The url of merge request.
- `mention` - _Optional_ - Ex: [toall]
- `pipelineURL` - _Optional_ - The url of pipeline.
