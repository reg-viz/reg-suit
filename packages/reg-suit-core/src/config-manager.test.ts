import assert from "assert";
import { CoreConfig } from "reg-suit-interface";
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

test("replace placeholders in config", () => {
  const conf = {
    core: { actualDir: "$HOGE_FOO", workingDir: "HOGE_FOO" },
    plugins: {
      "some-plugin": { xxx: "$HOGE_FOO", yyy: "${HOGE_FOO}", zzz: "HOGE_FOO" },
    },
  };
  const manager = createManager();
  manager._loadedConfig = conf;
  const actual = manager.replaceEnvValue() as any;
  assert.equal(actual.plugins["some-plugin"].xxx, process.env["HOGE_FOO"]);
  assert.equal(actual.plugins["some-plugin"].yyy, process.env["HOGE_FOO"]);
  assert.equal(actual.plugins["some-plugin"].zzz, "HOGE_FOO");
  assert.equal(actual.core.actualDir, process.env["HOGE_FOO"]);
  assert.equal(actual.core.workingDir, "HOGE_FOO");
});

test("replace nested placeholders", () => {
  const conf = {
    core: coreConf,
    plugins: {
      "some-plugin": { xxx: { yyy: "$HOGE_FOO" } },
    },
  };
  const manager = createManager();
  manager._loadedConfig = conf;
  const actual = manager.replaceEnvValue() as any;
  assert.equal(actual.plugins["some-plugin"].xxx.yyy, process.env["HOGE_FOO"]);
});

test("replace placeholders in array", () => {
  const conf = {
    core: coreConf,
    plugins: {
      "some-plugin": { xxx: ["$HOGE_FOO"] },
    },
  };
  const manager = createManager();
  manager._loadedConfig = conf;
  const actual = manager.replaceEnvValue() as any;
  assert.equal(actual.plugins["some-plugin"].xxx[0], process.env["HOGE_FOO"]);
});

test("escape $$ to $", () => {
  const conf = {
    core: coreConf,
    plugins: {
      "some-plugin": { xxx: "$$HOGE_FOO" },
    },
  };
  const manager = createManager();
  manager._loadedConfig = conf;
  const actual = manager.replaceEnvValue() as any;
  assert.equal(actual.plugins["some-plugin"].xxx, "$HOGE_FOO");
});

test("replace only once", () => {
  const conf = {
    core: coreConf,
    plugins: {
      "some-plugin": { xxx: "$HOGE_FOO", yyy: "$$HOGE_FOO" },
    },
  };
  const manager = createManager();
  manager._loadedConfig = conf;
  manager._loadedConfig = manager.replaceEnvValue();
  const actual = manager.replaceEnvValue() as any;
  assert.equal(actual.plugins["some-plugin"].xxx, process.env["HOGE_FOO"]);
  assert.equal(actual.plugins["some-plugin"].yyy, "$HOGE_FOO");
});
