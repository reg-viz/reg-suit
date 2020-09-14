import { PluginCreateOptions, PluginPreparer } from "reg-suit-interface";

import { SlackNotiferPluginOptions } from "./slack-notifier-plugin";
import { sendWebHook } from "./send-web-hook";

export interface QuestionResult {
  webhookUrl?: string;
  sendTestMessage: boolean;
}

export class SlackPreparer implements PluginPreparer<QuestionResult, SlackNotiferPluginOptions> {
  inquire() {
    return [
      {
        name: "webhookUrl",
        type: "input",
        message: "Incoming webhook URL",
      },
      {
        name: "sendTestMessage",
        type: "confirm",
        message: "Send test message to this URL ?",
        default: true,
        when: ({ webhookUrl }: { webhookUrl?: string }) => !!webhookUrl,
      },
    ];
  }

  prepare(opt: PluginCreateOptions<QuestionResult>): Promise<SlackNotiferPluginOptions> {
    const logger = opt.logger;
    const { webhookUrl, sendTestMessage } = opt.options;
    if (!webhookUrl || !webhookUrl.length) {
      logger.warn(logger.colors.magenta("webhookUrl") + " is required parameter, edit this params later.");
      return Promise.resolve({ webhookUrl: "your_incoming_webhook_url" });
    }
    if (sendTestMessage) {
      return sendWebHook({ webhookUrl, body: "test message", color: "good" })
        .then(() => {
          logger.info("Send test message successfully.");
          return { webhookUrl };
        })
        .catch(reason => {
          logger.error(logger.colors.red(reason.message));
          return Promise.reject(reason.error);
        });
    } else {
      return Promise.resolve({ webhookUrl });
    }
  }
}
