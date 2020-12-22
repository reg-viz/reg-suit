import { PluginCreateOptions, PluginLogger, NotifierPlugin, NotifyParams } from "reg-suit-interface";

import { sendWebHook } from "./send-web-hook";

export interface ChatworkNotiferPluginOptions {
  roomID: string;
  chatworkToken: string;
  mention?: string;
  message?: string;
  mrUrl?: string;
  pipelineUrl?: string;
}

export class ChatworkNotifierPlugin implements NotifierPlugin<ChatworkNotiferPluginOptions> {
  _logger!: PluginLogger;
  _roomID!: string;
  _mention?: string;
  _chatworkToken!: string;
  _mrUrl?: string;
  _pipelineUrl?: string;
  _noEmmit!: boolean;

  init(config: PluginCreateOptions<ChatworkNotiferPluginOptions>): void {
    this._logger = config.logger;
    this._roomID = config.options.roomID;
    this._mention = config.options.mention;
    this._mrUrl = config.options.mrUrl;
    this._pipelineUrl = config.options.pipelineUrl;
    this._chatworkToken = config.options.chatworkToken;
    this._noEmmit = config.noEmit;
  }

  notify(params: NotifyParams): Promise<any> {
    const message = this.createMessage(params);
    this._logger.info(`Send to chatwork ${this._logger.colors.green(this._roomID)}.`);
    this._logger.verbose("body to send to chatwork", message);
    if (this._noEmmit) return Promise.resolve();
    const spinner = this._logger.getSpinner("sending message to chatwork...");
    spinner.start();
    return sendWebHook({ message: message, chatworkToken: this._chatworkToken, roomID: this._roomID })
      .then(() => spinner.stop())
      .catch(() => spinner.stop());
  }

  createMessage(params: NotifyParams) {
    const lines = [];
    const emoji = this.createEmoji(params);
    if (this._mention && this._mention.length > 0) {
      lines.push(this._mention);
    }
    lines.push(`[info][title] ` + emoji + ` Reg result for ${params.actualKey} ` + emoji + `[/title]`);
    const { passedItems, failedItems, newItems, deletedItems } = params.comparisonResult;
    if (failedItems.length) {
      lines.push(`🔴  ${failedItems.length} changed items.`);
    }
    if (newItems.length) {
      lines.push(`⚪️  ${newItems.length} new items.`);
    }
    if (deletedItems.length) {
      lines.push(`⚫️  ${deletedItems.length} deleted items.`);
    }
    if (passedItems.length) {
      lines.push(`🔵  ${passedItems.length} passed items.`);
    }
    if (params.reportUrl) {
      lines.push("");
      lines.push(`▲  Report Url: ${params.reportUrl}`);
    }
    if (this._mrUrl && this._mrUrl.length > 0) {
      lines.push("");
      lines.push(`■  Merge Request: ${this._mrUrl}`);
    }
    if (this._pipelineUrl && this._pipelineUrl.length > 0) {
      lines.push(`■  Pipeline Url: ${this._pipelineUrl}`);
    }
    return lines.join("\n") + ` [/info]`;
  }

  createEmoji(params: NotifyParams) {
    const { failedItems, newItems, deletedItems } = params.comparisonResult;

    if (failedItems.length) {
      return ";(;(;(";
    }
    if (newItems.length || deletedItems.length) {
      return ":^):^):^)";
    }
    return "(cracker)(cracker)(cracker)";
  }
}
