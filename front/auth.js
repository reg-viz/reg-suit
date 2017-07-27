/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 546);
/******/ })
/************************************************************************/
/******/ ({

/***/ 546:
/***/ (function(module, exports, __webpack_require__) {

(function getToken() {
    if (location.search[0] !== "?") {
        return;
    }
    var appEndpoint = "https://3dxybrpy57.execute-api.us-east-1.amazonaws.com/dev";
    var pairs = location.search.slice(1).split("&");
    var qmap = {};
    var redirectUrl = sessionStorage.redirectUrl || "index.html";
    pairs.forEach(function (p) {
        var kv = p.split("=");
        qmap[kv[0]] = kv[1];
    });
    if (qmap.code) {
        var xhr_1 = new XMLHttpRequest();
        xhr_1.onload = function () {
            if (xhr_1.status === 200) {
                var result = JSON.parse(xhr_1.responseText);
                if (result.error) {
                    // tslint:disable:no-console
                    console.error("oops", result.error);
                }
                else if (result.token) {
                    localStorage.appToken = result.token;
                    sessionStorage.removeItem("redirectUrl");
                    location.replace(redirectUrl);
                }
            }
        };
        xhr_1.open("POST", appEndpoint + "/api/login");
        xhr_1.setRequestHeader("Content-Type", "application/json");
        xhr_1.send(JSON.stringify({ code: qmap.code }));
    }
})();


/***/ })

/******/ });
//# sourceMappingURL=auth.js.map