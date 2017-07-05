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
      "some-plugin": { "xxx": "$TERM", "yyy": "${TERM}", "zzz": "TERM" }
    }
  };
  const manager = new ConfigManager();
  const actual = manager.replaceEnvValue(conf) as any;
  t.is(actual.plugins["some-plugin"].xxx, process.env["TERM"]);
  t.is(actual.plugins["some-plugin"].yyy, process.env["TERM"]);
  t.is(actual.plugins["some-plugin"].zzz, "TERM");
});

test("replace nested placeholders", t => {
  const conf = {
    core: coreConf,
    plugins: {
      "some-plugin": { "xxx": { "yyy": "$TERM" } }
    }
  };
  const manager = new ConfigManager();
  const actual = manager.replaceEnvValue(conf) as any;
  t.is(actual.plugins["some-plugin"].xxx.yyy, process.env["TERM"]);
});

test("replace placeholders in array", t => {
  const conf = {
    core: coreConf,
    plugins: {
      "some-plugin": { "xxx": ["$TERM"] }
    }
  };
  const manager = new ConfigManager();
  const actual = manager.replaceEnvValue(conf) as any;
  t.is(actual.plugins["some-plugin"].xxx[0], process.env["TERM"]);
});

test("escape $$ to $", t => {
  const conf = {
    core: coreConf,
    plugins: {
      "some-plugin": { "xxx": "$$TERM" }
    }
  };
  const manager = new ConfigManager();
  const actual = manager.replaceEnvValue(conf) as any;
  t.is(actual.plugins["some-plugin"].xxx, "$TERM");
});

test("replace only once", t => {
  const conf = {
    core: coreConf,
    plugins: {
      "some-plugin": { "xxx": "$TERM", "yyy": "$$TERM" }
    }
  };
  const manager = new ConfigManager();
  const actual = manager.replaceEnvValue(manager.replaceEnvValue(conf)) as any;
  t.is(actual.plugins["some-plugin"].xxx, process.env["TERM"]);
  t.is(actual.plugins["some-plugin"].yyy, "$TERM");
});
