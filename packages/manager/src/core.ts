export interface Publisher {
  fetch(key: string): Promise<any>;
  publish(key: string): Promise<any>;
}

export interface Notifier {
  notify(result: any): void;
}

export interface CoreConfig {
  workingDir: string;
  expectedDir: string;
  actualDir: string;
}

export interface Logger {
  info(msg: string): void;
  warn(msg: string): void;
  verbose(msg: string): void;
}

export interface PluginCreateOptions<T> {
  coreConfig: CoreConfig;
  logger: Logger;
  options: T;
}

export interface Plugin<T> {
  init(config: PluginCreateOptions<T>): void; 
}

export interface PluginPreparer<S, T> {
  inquire(opt: any): Promise<S>;
  prepare(option: PluginCreateOptions<S>): Promise<T>;
}

export interface PublisherPlugin<T> extends Publisher, Plugin<T> { }
export interface NotifierPlugin<T> extends Notifier, Plugin<T> { }

export type PublisherPluginFactory = <S, T>() => {
  preparer?: PluginPreparer<S, T>
  publisher: PublisherPlugin<T>;
}

export class RegSuitCore {
  publisher: PublisherPlugin<any>;
  notifiers: NotifierPlugin<any>[];

  loadPlugins() {
  }

}
