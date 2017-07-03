import { CoreConfig, Logger, ComparisonResult } from "./core";

export type PluginLogger = Logger;

export interface KeyGenerator {
  getExpectedKey(): Promise<string>;
  getActualKey(): Promise<string>;
}

export interface PublishResult {
  reportUrl: string;
}

export interface Publisher {
  fetch(key: string): Promise<any>;
  publish(key: string): Promise<PublishResult>;
}

export interface NotifyParams {
  expectedKey: string | null;
  actualKey: string;
  reportUrl: string | null;
  comparisonResult: ComparisonResult;
}

export interface Notifier {
  notify(params: NotifyParams): Promise<any>;
}

export interface PluginCreateOptions<T> {
  coreConfig: CoreConfig;
  logger: Logger;
  noEmit: boolean;
  options: T;
}

export interface Plugin<T> {
  init(config: PluginCreateOptions<T>): void; 
}

export type PreparerQuestions = any[]; // FIXME

export interface PluginPreparer<S, T> {
  inquire(): PreparerQuestions;
  prepare(option: PluginCreateOptions<S>): Promise<T>;
}

export interface KeyGeneratorPlugin<T> extends KeyGenerator, Plugin<T> { }
export interface PublisherPlugin<T> extends Publisher, Plugin<T> { }
export interface NotifierPlugin<T> extends Notifier, Plugin<T> { }

export interface KeyGeneratorPluginHolder<S, T> {
  preparer?: PluginPreparer<S, T>;
  keyGenerator: KeyGeneratorPlugin<T>;
}

export interface PublisherPluginHolder<S, T> {
  preparer?: PluginPreparer<S, T>;
  publisher: PublisherPlugin<T>;
}

export interface NotifierPluginHolder<S, T> {
  preparer?: PluginPreparer<S, T>;
  notifier: NotifierPlugin<T>;
}

export type KeyGeneratorPluginFactory = <S, T>() => KeyGeneratorPluginHolder<S, T>;
export type PublisherPluginFactory = <S, T>() => PublisherPluginHolder<S, T>;
export type NotifierPluginFactory = <S, T>() => NotifierPluginHolder<S, T>;
