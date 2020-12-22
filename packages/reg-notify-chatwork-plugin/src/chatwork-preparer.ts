import { PluginCreateOptions, PluginPreparer } from "reg-suit-interface";

import { ChatworkNotiferPluginOptions } from "./chatwork-notifier-plugin";
import { sendWebHook } from "./send-web-hook";

export interface QuestionResult {
  chatworkToken?: string;
  roomID?: string;
  sendTestMessage: boolean;
}

export class ChatworkPreparer implements PluginPreparer<QuestionResult, ChatworkNotiferPluginOptions> {
  inquire() {
    return [
      {
        name: "chatworkToken",
        type: "input",
        message: "Chatwork Token",
      },
      {
        name: "sendTestMessage",
        type: "confirm",
        message: "Send test message to this Url ?",
        default: true,
        when: ({ chatworkToken }: { chatworkToken?: string }) => !!chatworkToken,
      },
    ];
  }

  prepare(opt: PluginCreateOptions<QuestionResult>): Promise<ChatworkNotiferPluginOptions> {
    const logger = opt.logger;
    const { chatworkToken, roomID, sendTestMessage } = opt.options;
    if (!chatworkToken || !chatworkToken.length) {
      logger.warn(logger.colors.magenta("chatworkToken") + " is required parameter, edit this params later.");
      return Promise.resolve({ chatworkToken: "your_chatwork_token", roomID: "" });
    }
    if (!roomID || !roomID.length) {
      logger.warn(logger.colors.magenta("roomID") + " is required parameter, edit this params later.");
      return Promise.resolve({ roomID: "your_room_id", chatworkToken: "" });
    }
    if (sendTestMessage) {
      return sendWebHook({ chatworkToken: chatworkToken, message: "test message", roomID: roomID })
        .then(() => {
          logger.info("Send test message successfully.");
          return { roomID: roomID, chatworkToken: chatworkToken };
        })
        .catch(reason => {
          logger.error(logger.colors.red(reason.message));
          return Promise.reject(reason.error);
        });
    } else {
      return Promise.resolve({ roomID: roomID, chatworkToken: chatworkToken });
    }
  }
}
