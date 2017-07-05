import { RegSuitCore } from "reg-suit-core";
import { CliOptions } from "./cli-options";
import packageUtil from "./package-util";

let _coreInstanceForCache: RegSuitCore;
function getRegCore(options: CliOptions, ignoreCache = false) {
  const localCoreModuleId = options.noInstallCore ? null : packageUtil.checkInstalledLocalCore();
  let core: RegSuitCore;
  if (!ignoreCache && _coreInstanceForCache) {
    return _coreInstanceForCache;
  }
  if (localCoreModuleId) {
    // use local installed reg-suit-core if user project has it.
    const CoreFactory = require(localCoreModuleId)["RegSuitCore"] as typeof RegSuitCore;
    core = new CoreFactory({
      logLevel: options.logLevel,
      noEmit: options.noEmit,
    });
  } else {
    core = new RegSuitCore({
      logLevel: options.logLevel,
      noEmit: options.noEmit,
    });
  }
  _coreInstanceForCache = core;
  return _coreInstanceForCache;
}

export default getRegCore;
