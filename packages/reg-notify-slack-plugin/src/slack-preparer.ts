import {
  PluginCreateOptions,
  PluginPreparer
} from "reg-suit-core/lib/plugin";

import { SlackNotiferPluginOptions } from "./slack-notifier-plugin";
import { sendWebHook } from "./send-web-hook";

export interface QuestionResult {
  webhookUrl: string;
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
      },
    ];
  }

  prepare(opt: PluginCreateOptions<QuestionResult>): Promise<SlackNotiferPluginOptions> {
    const logger = opt.logger;
    const { webhookUrl } = opt.options;
    if (opt.options.sendTestMessage) {
      return sendWebHook({ webhookUrl, body: "test message" }).then(() => {
        logger.info("Send test message successfully.");
        return { webhookUrl };
      });
    } else {
      return Promise.resolve({ webhookUrl });
    }
  }
}
