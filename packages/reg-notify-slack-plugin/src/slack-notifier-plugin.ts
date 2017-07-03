import {
  PluginCreateOptions,
  PluginLogger,
  NotifierPlugin,
  NotifyParams
} from "reg-suit-interface";

import { sendWebHook } from "./send-web-hook";

export interface SlackNotiferPluginOptions {
  webhookUrl: string;
}

export class SlackNotifierPlugin implements NotifierPlugin<SlackNotiferPluginOptions> {
  _logger: PluginLogger;
  _webhookUrl: string;

  init(config: PluginCreateOptions<SlackNotiferPluginOptions>): void {
    this._logger = config.logger;
    this._webhookUrl = config.options.webhookUrl;
  }

  notify(params: NotifyParams): Promise<any> {
    const body = this.createBody(params);
    return sendWebHook({
      body,
      webhookUrl: this._webhookUrl,
    });
  }

  createBody(params: NotifyParams) {
    const lines = [];
    lines.push(`Reg result for ${params.actualKey}:`);
    const { passedItems, failedItems, newItems, deletedItems } = params.comparisonResult;
    if (failedItems.length) {
      lines.push(`  ${failedItems.length} changed items.`);
    }
    if (newItems.length) {
      lines.push(`  ${newItems.length} new items.`);
    }
    if (deletedItems.length) {
      lines.push(`  ${deletedItems.length} deleted items.`);
    }
    if (passedItems.length) {
      lines.push(`  ${passedItems.length} passed items.`);
    }
    if (params.reportUrl) {
      lines.push("");
      lines.push(`Report URL: ${params.reportUrl}`);
    }
    return lines.join("\n");
  }
}
