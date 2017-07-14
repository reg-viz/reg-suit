import * as path from "path";
import {
  CoreConfig,
  PluginCreateOptions,
  KeyGeneratorPlugin,
  PublisherPlugin,
  NotifierPlugin,
  NotifyParams,
  PluginLogger,
  ComparisonResult,
} from "reg-suit-interface";
import { fsUtil } from "reg-suit-util";

const compare = require("reg-cli");

export interface ProcessorOptions {
  keyGenerator?: KeyGeneratorPlugin<any>;
  publisher?: PublisherPlugin<any>;
  notifiers: NotifierPlugin<any>[];
  directoryInfo: {
    workingDir: string;
    actualDir: string;
    expectedDir: string;
  };
}

export interface StepResultAfterExpectedKey {
  expectedKey: string | null;
}

export interface StepResultAfterComparison extends StepResultAfterExpectedKey {
  comparisonResult: ComparisonResult;
}

export interface StepResultAfterActualKey extends StepResultAfterComparison {
  actualKey: string ;
}

export interface StepResultAfterPublish extends StepResultAfterActualKey {
  reportUrl: string | null;
}

export class RegProcessor {

  private _logger: PluginLogger;
  private _config: CoreConfig;
  private _directoryInfo: ProcessorOptions["directoryInfo"];
  private _keyGenerator?: KeyGeneratorPlugin<any>;
  private _publisher?: PublisherPlugin<any>;
  private _notifiers: NotifierPlugin<any>[];

  constructor(
    opt: PluginCreateOptions<ProcessorOptions>,
  ) {
    this._logger = opt.logger;
    this._config = opt.coreConfig;
    this._directoryInfo = opt.options.directoryInfo;
    this._keyGenerator = opt.options.keyGenerator;
    this._publisher = opt.options.publisher;
    this._notifiers = opt.options.notifiers;
  }

  runAll() {
    return this.getExpectedKey()
    .then(ctx => this.fetch(ctx))
    .then(ctx => this.compare(ctx))
    .then(ctx => this.getActualKey(ctx))
    .then(ctx => this.publish(ctx))
    .then(ctx => this.notify(ctx))
    ;
  }

  getExpectedKey(): Promise<StepResultAfterExpectedKey> {
    if (this._keyGenerator) {
      return this._keyGenerator.getExpectedKey()
        .then(key => {
          this._logger.info(`Detected the previous snapshot key: '${key}'`);
          return { expectedKey: key };
        })
        .catch(reason => {
          this._logger.warn("Failed to detect the previous snapshot key");
          this._logger.error(reason);
          return Promise.resolve({ expectedKey: null });
        })
      ;
    } else {
      this._logger.info("Skipped to detect the previous snapshot key because key generator plugin is not set up.");
      return Promise.resolve({ expectedKey: null });
    }
  }

  compare(ctx: StepResultAfterExpectedKey): Promise<StepResultAfterComparison> {
    const { actualDir, expectedDir, workingDir } = this._directoryInfo;
    return (compare({
      actualDir,
      expectedDir,
      diffDir: path.join(workingDir, "diff"),
      json: path.join(workingDir, "out.json"),
      report: path.join(workingDir, "index.html"),
      update: false,
      ignoreChange: true,
      urlPrefix: "",
      threshold: .5,
    }) as Promise<ComparisonResult>)
    .then(result => {
      this._logger.verbose("Comparison result:", result);
      return { ...ctx, comparisonResult: result };
    })
    .catch(reason => {
      // re-throw notifiers error because it's fatal.
      this._logger.error("An error occurs during compare images:");
      this._logger.error(reason);
      return Promise.reject<StepResultAfterComparison>(reason);
    });
  }

  getActualKey(ctx: StepResultAfterComparison): Promise<StepResultAfterActualKey> {
    const fallbackFn = () => "snapshot_" + ~~(new Date().getTime() / 1000);
    if (this._keyGenerator) {
      return this._keyGenerator.getActualKey().then(key => {
        if (!key) {
          this._logger.warn("Failed to generate the current snapshot key.");
          return { ...ctx, actualKey: fallbackFn() };
        }
        this._logger.info(`The current snapshot key: '${key}'`);
        return { ...ctx, actualKey: key };
      }).catch(reason => {
        this._logger.warn("Failed to gerenate the current snapshot key.");
        this._logger.error(reason);
        return Promise.resolve({ ...ctx, actualKey: fallbackFn() });
      });
    } else {
      const fallbackKey = fallbackFn();
      this._logger.info(`Use '${fallbackKey}' as the current snapshot key because key generator plugin is not set up.`);
      return Promise.resolve({ ...ctx, actualKey: fallbackKey });
    }
  }

  fetch(ctx: StepResultAfterExpectedKey): Promise<StepResultAfterExpectedKey> {
    const keyForExpected = ctx.expectedKey;
    if (this._publisher && keyForExpected) {
      return this._publisher.fetch(keyForExpected);
    } else if (!keyForExpected) {
      this._logger.info("Skipped to fetch the expeceted data because expected key is null.");
      return Promise.resolve(ctx);
    } else if (!this._publisher) {
      this._logger.info("Skipped to fetch the expeceted data because publisher plugin is not set up.");
      return Promise.resolve(ctx);
    } else {
      return Promise.resolve(ctx);
    }
  }

  publish(ctx: StepResultAfterActualKey): Promise<StepResultAfterPublish> {
    if (this._publisher) {
      return this._publisher.publish(ctx.actualKey)
        .then(result => {
          this._logger.info(`Published snapshot '${ctx.actualKey}' successfully.`);
          if (result.reportUrl) {
            this._logger.info(`Report URL: ${result.reportUrl}`);
          }
          this._logger.verbose("Publish result:", result);
          return { ...ctx, reportUrl: result.reportUrl };
        })
        .catch(reason => {
          // re-throw notifiers error because it's fatal.
          this._logger.error("An error occurs during publishing snapshot:");
          this._logger.error(reason);
          return Promise.reject<StepResultAfterPublish>(reason);
        })
      ;
    } else {
      this._logger.info("Skipped to publish the snapshot data because publisher plugin is not set up.");
      return Promise.resolve(ctx);
    }
  }

  notify(ctx: StepResultAfterPublish): Promise<StepResultAfterPublish> {
    const notifyParams: NotifyParams = {
      ...ctx,
    };
    if (!this._notifiers.length) {
      this._logger.info("Skipped to notify result because notifier plugins are not set up.");
    }
    this._logger.verbose("Notify parameters:", notifyParams);
    return Promise.all(
      this._notifiers.map((notifier) => {
        return notifier.notify(notifyParams).catch((reason) => {
          // Don't re-throw notifiers error because it's not fatal.
          this._logger.error("An error occurs during notify:");
          this._logger.error(reason);
          return Promise.resolve();
        });
      })
    ).then(() => ctx);
  }
}
