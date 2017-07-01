import * as chalk from "chalk";
import { Logger } from "./core-interface";

export type LogLevel = "verbose" | "info" | "silent";

// TODO chalk, plugin category setter, --no-color opt

export class RegLogger implements Logger {

  _level: LogLevel;

  setLevel(v: LogLevel) {
    this._level = v;
  }

  constructor(private _category = "reg-suit") {
    this._level = "info";
  }

  info(msg: string) {
    if (this._level !== "silent") {
      console.log(this._prefix + chalk.green("info ") + msg);
    }
  }

  warn(msg: string) {
    if (this._level !== "silent") {
      console.warn(this._prefix + chalk.bgYellow("warn ") + chalk.yellow(msg));
    }
  }

  error(obj: string | Error) {
    if (this._level !== "silent") {
      if (typeof obj === "string") {
        console.error(this._prefix + chalk.red(obj));
      } else {
        console.error(this._prefix + obj);
      }
    }
  }

  verbose(msg: string) {
    if (this._level === "verbose") {
      console.log(this._prefix + chalk.green("debug ") + chalk.gray(msg));
    }
  }

  get _prefix() {
    return `[${this._category}] `;
  }
}

const regLogger = new RegLogger();

export default regLogger;
