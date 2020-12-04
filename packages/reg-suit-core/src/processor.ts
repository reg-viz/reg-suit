import path from "path";
import {
  CoreConfig,
  WorkingDirectoryInfo,
  PluginCreateOptions,
  KeyGeneratorPlugin,
  PublisherPlugin,
  NotifierPlugin,
  NotifyParams,
  PluginLogger,
  ComparisonResult,
} from "reg-suit-interface";
import { EventEmitter } from "events";

const compare = require("reg-cli");
const rimraf = require("rimraf");
const cpx = require("cpx");

export interface ProcessorOptions {
  keyGenerator?: KeyGeneratorPlugin<any>;
  publisher?: PublisherPlugin<any>;
  notifiers: NotifierPlugin<any>[];
  userDirs: {
    actualDir: string;
  };
}

export interface StepResultAfterExpectedKey {
  expectedKey: string | null;
}

export interface StepResultAfterComparison extends StepResultAfterExpectedKey {
  comparisonResult: ComparisonResult;
}

export interface StepResultAfterActualKey extends StepResultAfterComparison {
  actualKey: string;
}

export interface StepResultAfterPublish extends StepResultAfterActualKey {
  reportUrl?: string;
}

export class RegProcessor {
  private _logger: PluginLogger;
  private _config: CoreConfig;
  private _directoryInfo: {
    workingDirs: WorkingDirectoryInfo;
    userDirs: {
      actualDir: string;
    };
  };
  private _keyGenerator?: KeyGeneratorPlugin<any>;
  private _publisher?: PublisherPlugin<any>;
  private _notifiers: NotifierPlugin<any>[];

  constructor(opt: PluginCreateOptions<ProcessorOptions>) {
    this._logger = opt.logger;
    this._config = opt.coreConfig;
    this._directoryInfo = {
      workingDirs: opt.workingDirs,
      userDirs: opt.options.userDirs,
    };
    this._keyGenerator = opt.options.keyGenerator;
    this._publisher = opt.options.publisher;
    this._notifiers = opt.options.notifiers;
  }

  runAll() {
    return this.getExpectedKey()
      .then(ctx => this.syncExpected(ctx))
      .then(ctx => this.compare(ctx))
      .then(ctx => this.getActualKey(ctx))
      .then(ctx => this.publish(ctx))
      .then(ctx => this.notify(ctx));
  }

  getExpectedKey(): Promise<StepResultAfterExpectedKey> {
    if (this._keyGenerator) {
      return this._keyGenerator
        .getExpectedKey()
        .then(key => {
          this._logger.info(`Detected the previous snapshot key: '${key}'`);
          return { expectedKey: key };
        })
        .catch(reason => {
          this._logger.warn("Failed to detect the previous snapshot key");
          if (reason) this._logger.error(reason);
          return Promise.resolve({ expectedKey: null });
        });
    } else {
      this._logger.info("Skipped to detect the previous snapshot key because key generator plugin is not set up.");
      return Promise.resolve({ expectedKey: null });
    }
  }

  compare(ctx: StepResultAfterExpectedKey): Promise<StepResultAfterComparison> {
    const { actualDir, expectedDir, diffDir } = this._directoryInfo.workingDirs;
    const json = path.join(this._directoryInfo.workingDirs.base, "out.json");
    const report = path.join(this._directoryInfo.workingDirs.base, "index.html");
    const ximgdiffConf = this._config.ximgdiff || { invocationType: "cli" };
    rimraf.sync(actualDir);
    cpx.copySync(`${this._directoryInfo.userDirs.actualDir}/**/*.{png,jpg,jpeg,tiff,bmp,gif}`, actualDir);
    const emitter = compare({
      actualDir,
      expectedDir,
      diffDir,
      json,
      report,
      update: false,
      ignoreChange: true,
      urlPrefix: "",
      threshold: this._config.threshold,
      thresholdPixel: this._config.thresholdPixel,
      thresholdRate: this._config.thresholdRate,
      matchingThreshold: this._config.matchingThreshold ?? 0, // matchingThreshold should not be undefined
      enableAntialias: this._config.enableAntialias,
      enableCliAdditionalDetection: ximgdiffConf.invocationType === "cli",
      enableClientAdditionalDetection: ximgdiffConf.invocationType !== "none",
    }) as EventEmitter;
    emitter.on("compare", (compareItem: { type: string; path: string }) => {
      this._logger.verbose(
        `${this._logger.colors.red(compareItem.type)}: ${this._logger.colors.magenta(compareItem.path)}`,
      );
    });
    const comparisonResult = new Promise<ComparisonResult>((resolve, reject) => {
      emitter.once("complete", (result: ComparisonResult) => resolve(result));
      emitter.once("error", (reason: any) => reject(reason));
    });
    return comparisonResult
      .then(result => {
        this._logger.info("Comparison Complete");
        this._logger.info(this._logger.colors.red("   Changed items: " + result.failedItems.length));
        this._logger.info(this._logger.colors.cyan("   New items: " + result.newItems.length));
        this._logger.info(this._logger.colors.redBright("   Deleted items: " + result.deletedItems.length));
        this._logger.info(this._logger.colors.green("   Passed items: " + result.passedItems.length));
        this._logger.verbose("Comparison details:", result);
        return { ...ctx, comparisonResult: result };
      })
      .catch(reason => {
        // re-throw notifiers error because it's fatal.
        this._logger.error("An error occurs during compare images:");
        if (reason) this._logger.error(reason);
        return Promise.reject<StepResultAfterComparison>(reason);
      });
  }

  getActualKey(ctx: StepResultAfterComparison): Promise<StepResultAfterActualKey> {
    const fallbackFn = () => "snapshot_" + ~~(new Date().getTime() / 1000);
    if (this._keyGenerator) {
      return this._keyGenerator
        .getActualKey()
        .then(key => {
          if (!key) {
            this._logger.warn("Failed to generate the current snapshot key.");
            return { ...ctx, actualKey: fallbackFn() };
          }
          this._logger.info(`The current snapshot key: '${key}'`);
          return { ...ctx, actualKey: key };
        })
        .catch(reason => {
          this._logger.warn("Failed to gerenate the current snapshot key.");
          if (reason) this._logger.error(reason);
          return Promise.resolve({ ...ctx, actualKey: fallbackFn() });
        });
    } else {
      const fallbackKey = fallbackFn();
      this._logger.info(`Use '${fallbackKey}' as the current snapshot key because key generator plugin is not set up.`);
      return Promise.resolve({ ...ctx, actualKey: fallbackKey });
    }
  }

  syncExpected(ctx: StepResultAfterExpectedKey): Promise<StepResultAfterExpectedKey> {
    const keyForExpected = ctx.expectedKey;
    if (this._publisher && keyForExpected) {
      return this._publisher.fetch(keyForExpected);
    } else if (!keyForExpected) {
      this._logger.info("Skipped to fetch the expected data because expected key is null.");
      return Promise.resolve(ctx);
    } else if (!this._publisher) {
      this._logger.info("Skipped to fetch the expected data because publisher plugin is not set up.");
      return Promise.resolve(ctx);
    } else {
      return Promise.resolve(ctx);
    }
  }

  publish(ctx: StepResultAfterActualKey): Promise<StepResultAfterPublish> {
    if (this._publisher) {
      return this._publisher
        .publish(ctx.actualKey)
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
          if (reason.code === "CredentialsError") {
            this._logger.error("Failed to read AWS credentials.");
            this._logger.error(
              `Create ${this._logger.colors.magenta("~/.aws/credentials")} or export ${this._logger.colors.green(
                "$AWS_ACCESS_KEY_ID",
              )} and ${this._logger.colors.green("$AWS_SECRET_ACCESS_KEY")}.`,
            );
          }
          if (reason) this._logger.error(reason);
          return Promise.reject<StepResultAfterPublish>(reason);
        });
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
    return this._notifiers
      .reduce((queue, notifier) => {
        return queue
          .then(() => notifier.notify(notifyParams))
          .catch(reason => {
            // Don't re-throw notifiers error because it's not fatal.
            this._logger.error("An error occurs during notify:");
            this._logger.error(reason);
            return Promise.resolve();
          });
      }, Promise.resolve())
      .then(() => ctx);
  }
}
