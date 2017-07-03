export interface CoreConfig {
  workingDir: string;
  expectedDir: string;
  actualDir: string;
}

export interface RegSuitConfiguration {
  core: CoreConfig;
  plugins?: {
    [key: string]: any;
  };
}

export interface Logger {
  info(msg: string): void;
  warn(msg: string): void;
  error(msg: string | Error): void;
  verbose(msg: string): void;
}

export interface CreateQuestionsOptions {
  configFileName?: string;
  pluginNames: string[];
}

export interface ComparisonResult {
  failedItems: string[];
  newItems: string[];
  deletedItems: string[];
  passedItems: string[];
  expectedItems: string[];
  actualItems: string[];
  diffItems: string[];
  actualDir: string;
  expectedDir: string;
  diffDir: string;
}
