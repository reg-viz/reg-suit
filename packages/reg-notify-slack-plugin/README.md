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

- `webhookUrl` - *Required* - The incoming WebHook URL sending message your Slack channel.
