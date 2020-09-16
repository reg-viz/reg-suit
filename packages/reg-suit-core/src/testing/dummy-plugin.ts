import {
  PublisherPlugin,
  NotifierPlugin,
  NotifyParams,
  KeyGeneratorPlugin,
  PublishResult,
  PluginCreateOptions,
  PublisherPluginFactory,
  KeyGeneratorPluginFactory,
  NotifierPluginFactory,
} from "reg-suit-interface";

class DummyPlugin implements PublisherPlugin<null>, KeyGeneratorPlugin<null>, NotifierPlugin<null> {
  init(_config: PluginCreateOptions<null>) {}

  getExpectedKey(): Promise<string> {
    return Promise.resolve("expected");
  }

  fetch(_key: string): Promise<any> {
    return Promise.resolve("fetch");
  }

  getActualKey(): Promise<string> {
    return Promise.resolve("actual");
  }

  publish(_key: string): Promise<PublishResult> {
    return Promise.resolve({ reportUrl: "" });
  }

  notify(_params: NotifyParams): Promise<any> {
    return Promise.resolve("notify");
  }
}

const factory: PublisherPluginFactory & NotifierPluginFactory & KeyGeneratorPluginFactory = () => {
  const p = new DummyPlugin();
  return {
    keyGenerator: p,
    notifier: p,
    publisher: p,
  };
};

export = factory;
