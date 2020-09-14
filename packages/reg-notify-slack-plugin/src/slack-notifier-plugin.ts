import { PluginCreateOptions, PluginLogger, NotifierPlugin, NotifyParams } from "reg-suit-interface";

import { sendWebHook } from "./send-web-hook";

export interface SlackNotiferPluginOptions {
  webhookUrl: string;
}

export class SlackNotifierPlugin implements NotifierPlugin<SlackNotiferPluginOptions> {
  _logger!: PluginLogger;
  _webhookUrl!: string;
  _noEmmit!: boolean;

  init(config: PluginCreateOptions<SlackNotiferPluginOptions>): void {
    this._logger = config.logger;
    this._webhookUrl = config.options.webhookUrl;
    this._noEmmit = config.noEmit;
  }

  notify(params: NotifyParams): Promise<any> {
    const body = this.createBody(params);
    const color = this.createColor(params);
    this._logger.info(`Send to slack ${this._logger.colors.green(this._webhookUrl)}.`);
    this._logger.verbose("body to send to slack", body);
    if (this._noEmmit) return Promise.resolve();
    const spinner = this._logger.getSpinner("sending message to Slack...");
    spinner.start();
    return sendWebHook({ body, color, webhookUrl: this._webhookUrl })
      .then(() => spinner.stop())
      .catch(() => spinner.stop());
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

  createColor(params: NotifyParams) {
    const { failedItems, newItems, deletedItems } = params.comparisonResult;

    if (failedItems.length) {
      return "danger";
    }
    if (newItems.length || deletedItems.length) {
      return "warning";
    }
    return "good";
  }
}
