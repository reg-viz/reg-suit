import { PluginLogger, PluginCreateOptions, KeyGeneratorPlugin } from "reg-suit-interface";

export interface PluginConfig {
  expectedKey: string;
  actualKey: string;
}

export class SimpleKeygenPlugin implements KeyGeneratorPlugin<PluginConfig> {
  _logger: PluginLogger;
  _options: PluginConfig;
  init(config: PluginCreateOptions<PluginConfig>): void {
    this._logger = config.logger;
    this._options = config.options;
  }

  getExpectedKey(): Promise<string> {
    if (!this._options.expectedKey || !this._options.expectedKey.length) {
      this._logger.warn("Expected key must be non null string.");
      return Promise.reject<string>(null);
    }
    return Promise.resolve(this._options.expectedKey);
  }

  getActualKey(): Promise<string> {
    if (!this._options.actualKey || !this._options.actualKey.length) {
      this._logger.warn("Actual key must be non null string.");
      return Promise.reject<string>(null);
    }
    return Promise.resolve(this._options.actualKey);
  }
}
