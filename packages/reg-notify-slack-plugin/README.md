# reg-notify-slack-plugin

A reg-suit plugin to send notification the testing result to Slack channel.

## Install

```sh
npm i reg-notify-slack-plugin
reg-suit prepare -p notify-slack
```

## Configure

```ts
{
  webhookUrl: string;
}
```

- `webhookUrl` - _Required_ - The incoming WebHook URL sending message your Slack channel.
