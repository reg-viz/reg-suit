import test from "ava";

import { CoreConfig, RegSuitConfiguration } from "reg-suit-interface";
import { createLogger } from "reg-suit-util";
import { ConfigManager } from "./config-manager";

const coreConf: CoreConfig = {
  actualDir: "",
  workingDir: "",
};

function createManager() {
  const logger = createLogger();
  logger.setLevel("silent");
  return new ConfigManager({ logger, noEmit: true });
}

test("replace placeholders in config", t => {
  const conf = {
    core: { actualDir: "$HOGE_FOO", workingDir: "HOGE_FOO" },
    plugins: {
      "some-plugin": { "xxx": "$HOGE_FOO", "yyy": "${HOGE_FOO}", "zzz": "HOGE_FOO" }
    }
  };
  const manager = createManager();
  manager._loadedConfig = conf;
  const actual = manager.replaceEnvValue() as any;
  t.is(actual.plugins["some-plugin"].xxx, process.env["HOGE_FOO"]);
  t.is(actual.plugins["some-plugin"].yyy, process.env["HOGE_FOO"]);
  t.is(actual.plugins["some-plugin"].zzz, "HOGE_FOO");
  t.is(actual.core.actualDir, process.env["HOGE_FOO"]);
  t.is(actual.core.workingDir, "HOGE_FOO");
});

test("replace nested placeholders", t => {
  const conf = {
    core: coreConf,
    plugins: {
      "some-plugin": { "xxx": { "yyy": "$HOGE_FOO" } }
    }
  };
  const manager = createManager();
  manager._loadedConfig = conf;
  const actual = manager.replaceEnvValue() as any;
  t.is(actual.plugins["some-plugin"].xxx.yyy, process.env["HOGE_FOO"]);
});

test("replace placeholders in array", t => {
  const conf = {
    core: coreConf,
    plugins: {
      "some-plugin": { "xxx": ["$HOGE_FOO"] }
    }
  };
  const manager = createManager();
  manager._loadedConfig = conf;
  const actual = manager.replaceEnvValue() as any;
  t.is(actual.plugins["some-plugin"].xxx[0], process.env["HOGE_FOO"]);
});

test("escape $$ to $", t => {
  const conf = {
    core: coreConf,
    plugins: {
      "some-plugin": { "xxx": "$$HOGE_FOO" }
    }
  };
  const manager = createManager();
  manager._loadedConfig = conf;
  const actual = manager.replaceEnvValue() as any;
  t.is(actual.plugins["some-plugin"].xxx, "$HOGE_FOO");
});

test("replace only once", t => {
  const conf = {
    core: coreConf,
    plugins: {
      "some-plugin": { "xxx": "$HOGE_FOO", "yyy": "$$HOGE_FOO" }
    }
  };
  const manager = createManager();
  manager._loadedConfig = conf;
  manager._loadedConfig = manager.replaceEnvValue();
  const actual = manager.replaceEnvValue() as any;
  t.is(actual.plugins["some-plugin"].xxx, process.env["HOGE_FOO"]);
  t.is(actual.plugins["some-plugin"].yyy, "$HOGE_FOO");
});
