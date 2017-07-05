import test from "ava";

import { CoreConfig, RegSuitConfiguration } from "reg-suit-interface";
import { ConfigManager } from "./config-manager";

const coreConf: CoreConfig = {
  actualDir: "",
  expectedDir: "",
  workingDir: "",
};

test("do nothing conf without plugins section", t => {
  const conf = {
    core: coreConf,
  };
  const manager = new ConfigManager();
  const actual = manager.replaceEnvValue(conf) as any;
  t.is(actual, conf);
});

test("replace placeholders in config", t => {
  const conf = {
    core: coreConf,
    plugins: {
      "some-plugin": { "xxx": "$HOGE_FOO", "yyy": "${HOGE_FOO}", "zzz": "HOGE_FOO" }
    }
  };
  const manager = new ConfigManager();
  const actual = manager.replaceEnvValue(conf) as any;
  t.is(actual.plugins["some-plugin"].xxx, process.env["HOGE_FOO"]);
  t.is(actual.plugins["some-plugin"].yyy, process.env["HOGE_FOO"]);
  t.is(actual.plugins["some-plugin"].zzz, "HOGE_FOO");
});

test("replace nested placeholders", t => {
  const conf = {
    core: coreConf,
    plugins: {
      "some-plugin": { "xxx": { "yyy": "$HOGE_FOO" } }
    }
  };
  const manager = new ConfigManager();
  const actual = manager.replaceEnvValue(conf) as any;
  t.is(actual.plugins["some-plugin"].xxx.yyy, process.env["HOGE_FOO"]);
});

test("replace placeholders in array", t => {
  const conf = {
    core: coreConf,
    plugins: {
      "some-plugin": { "xxx": ["$HOGE_FOO"] }
    }
  };
  const manager = new ConfigManager();
  const actual = manager.replaceEnvValue(conf) as any;
  t.is(actual.plugins["some-plugin"].xxx[0], process.env["HOGE_FOO"]);
});

test("escape $$ to $", t => {
  const conf = {
    core: coreConf,
    plugins: {
      "some-plugin": { "xxx": "$$HOGE_FOO" }
    }
  };
  const manager = new ConfigManager();
  const actual = manager.replaceEnvValue(conf) as any;
  t.is(actual.plugins["some-plugin"].xxx, "$HOGE_FOO");
});

test("replace only once", t => {
  const conf = {
    core: coreConf,
    plugins: {
      "some-plugin": { "xxx": "$HOGE_FOO", "yyy": "$$HOGE_FOO" }
    }
  };
  const manager = new ConfigManager();
  const actual = manager.replaceEnvValue(manager.replaceEnvValue(conf)) as any;
  t.is(actual.plugins["some-plugin"].xxx, process.env["HOGE_FOO"]);
  t.is(actual.plugins["some-plugin"].yyy, "$HOGE_FOO");
});
