import * as path from "path";
import test from "ava";
import { PluginManager, PluginMetadata } from "./plugin-manager";
import { RegLogger } from "reg-suit-util";

function createPluginManager(pluginConfig: any) {
  const logger = new RegLogger();
  logger.setLevel("silent");
  const pm = new PluginManager(logger, false, {
    core: {
      actualDir: "",
      expectedDir: "",
      workingDir: path.join(__dirname, ".."),
    },
    plugins: pluginConfig,
  });
  return pm;
}

test("load plugin when non existing", t => {
  const pm = createPluginManager({ "non-existing-plugin": { } });
  t.throws(() => pm.loadPlugins());
});

test("load plugin when non existing", t => {
  const pm = createPluginManager({ "./lib/testing/dummy-plugin": { } });
  pm.loadPlugins();
  t.is(pm._pluginHolders.length, 1);
  t.is(pm._pluginHolders[0].moduleId, "./lib/testing/dummy-plugin");
});
