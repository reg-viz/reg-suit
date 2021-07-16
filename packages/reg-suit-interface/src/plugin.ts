import { Question } from "inquirer";
import { CoreConfig, ComparisonResult, WorkingDirectoryInfo, ProjectConfig } from "./core";
import { Logger } from "./logger";

export type PluginLogger = Logger;

export interface KeyGenerator {
  getExpectedKey(): Promise<string>;
  getActualKey(): Promise<string>;
}

export interface PublishResult {
  reportUrl?: string;
}

export interface Publisher {
  fetch(key: string): Promise<any>;
  publish(key: string): Promise<PublishResult>;
}

export interface NotifyParams {
  expectedKey: string | null;
  actualKey: string;
  reportUrl?: string;
  comparisonResult: ComparisonResult;
}

export interface Notifier {
  notify(params: NotifyParams): Promise<any>;
}

export interface PluginCreateOptions<T = undefined> {
  coreConfig: CoreConfig;
  projectConfig: ProjectConfig;
  workingDirs: WorkingDirectoryInfo;
  logger: Logger;
  noEmit: boolean;
  options: T;
}

export interface Plugin<T = undefined> {
  init(config: PluginCreateOptions<T>): void;
}

export type PreparerQuestion = Question;
export type PreparerQuestions = PreparerQuestion[];

export interface PluginPreparer<S, T> {
  inquire(): PreparerQuestions;
  prepare(option: PluginCreateOptions<S>): Promise<T>;
}

export interface KeyGeneratorPlugin<T = undefined> extends KeyGenerator, Plugin<T> {}
export interface PublisherPlugin<T = undefined> extends Publisher, Plugin<T> {}
export interface NotifierPlugin<T = undefined> extends Notifier, Plugin<T> {}

export interface KeyGeneratorPluginHolder<S, T = undefined> {
  preparer?: PluginPreparer<S, T>;
  keyGenerator: KeyGeneratorPlugin<T>;
}

export interface PublisherPluginHolder<S, T = undefined> {
  preparer?: PluginPreparer<S, T>;
  publisher: PublisherPlugin<T>;
}

export interface NotifierPluginHolder<S, T = undefined> {
  preparer?: PluginPreparer<S, T>;
  notifier: NotifierPlugin<T>;
}

export type KeyGeneratorPluginFactory = () => KeyGeneratorPluginHolder<any, any>;
export type PublisherPluginFactory = () => PublisherPluginHolder<any, any>;
export type NotifierPluginFactory = () => NotifierPluginHolder<any, any>;
