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

export interface Plugin {
  init(config: PluginCreateOptions<any>): void; 
}

export interface Setupper<T> {
  inquire(opt: any): Promise<T>;
  setup(option: PluginCreateOptions<T>): Promise<any>;
}

export interface PublisherPlugin extends Publisher, Plugin { }
export interface NotifierPlugin extends Notifier, Plugin { }

export type RegisterPublisherPlugin = () => { publisher: PublisherPlugin };
export type RegisterNotifierPlugin = () => { notifier: NotifierPlugin };

function isPublisher(plugin: Plugin): plugin is PublisherPlugin {
  return typeof (plugin as any)["fetch"] === "function" && typeof (plugin as any)["publish"] === "function";
}

export class RegSuitCore {
  publisher: PublisherPlugin;
  notifiers: NotifierPlugin[];

  loadPlugins() {
  }

  regist(plugin: Plugin) {
    if (isPublisher(plugin)) {
      this.publisher = plugin;
    }
  }
}
