import assert from "assert";
import * as path from "path";
import { PluginManager } from "./plugin-manager";
import { RegLogger } from "reg-suit-util";

function createPluginManager(pluginConfig: any) {
  const logger = new RegLogger();
  logger.setLevel("silent");
  const pm = new PluginManager(
    logger,
    false,
    {
      core: {
        actualDir: "",
        workingDir: path.join(__dirname, ".."),
      },
      plugins: pluginConfig,
    },
    { actualDir: "", base: "", diffDir: "", expectedDir: "" },
  );
  return pm;
}

test("should throws error when attempting to load non installed plugin", () => {
  const pm = createPluginManager({ "non-existing-plugin": {} });
  expect(() => pm.loadPlugins()).toThrowError();
});

test("should return pluginHolders", () => {
  const pm = createPluginManager({ "./lib/testing/dummy-plugin": {} });
  pm.loadPlugins();
  assert.equal(pm._pluginHolders.length, 1);
  assert.equal(pm._pluginHolders[0].moduleId, "./lib/testing/dummy-plugin");
});

test("resolve locally installed module", () => {
  const pm = createPluginManager({});
  const p = pm._resolve("reg-suit-util", path.resolve(__dirname, ".."));
  assert.equal(p.endsWith("reg-suit-util/lib/index.js"), true);
});

test("resolve relative path", () => {
  const pm = createPluginManager({});
  const actual = pm._resolve("../lib/testing/dummy-plugin", __dirname);
  assert.equal(actual, path.resolve(__dirname, "../lib/", "testing/dummy-plugin.js"));
});
