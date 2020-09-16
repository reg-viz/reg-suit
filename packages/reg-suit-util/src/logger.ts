import { Chalk, Instance } from "chalk";
import { Logger, Colors, Spinner, ProgressBar } from "reg-suit-interface";
import { Bar as ProgressBarConstructor, Presets } from "cli-progress";
import { Spinner as SpinnerConstructor } from "cli-spinner";

export type LogLevel = "verbose" | "info" | "silent";

const noopSpinner: Spinner = {
  start: () => {},
  stop: () => {},
};

const noopProgressBar: ProgressBar = {
  start: (_x: number, _y?: number) => {},
  update: (_x: number) => {},
  increment: (_x: number) => {},
  stop: () => {},
};

export class RegLogger implements Logger {
  _level: LogLevel;
  _chalk: Chalk;

  constructor(private _category = "reg-suit") {
    this._chalk = new Instance({ level: 1 });
    this._level = "info";
  }

  fork(newCategory: string) {
    const l = new RegLogger(newCategory);
    l.setLevel(this._level);
    return l;
  }

  setLevel(v: LogLevel) {
    this._level = v;
  }

  get colors(): Colors {
    return this._chalk as Colors;
  }

  set colors(_v: Colors) {
    return;
  }

  getSpinner(msg?: string): Spinner {
    if (this._level === "silent") return noopSpinner;
    const spinner = new SpinnerConstructor(msg);
    spinner.setSpinnerString(3);
    spinner.stop = spinner.stop.bind(spinner, true);
    return spinner;
  }

  getProgressBar(): ProgressBar {
    if (this._level === "silent") return noopProgressBar;
    const bar = new ProgressBarConstructor({}, Presets.rect);
    return bar;
  }

  info(msg: string) {
    if (this._level !== "silent") {
      // eslint-disable-next-line no-console
      console.log(this._prefix + this.colors.green("info ") + msg);
    }
  }

  warn(msg: string) {
    if (this._level !== "silent") {
      // eslint-disable-next-line no-console
      console.warn(this._prefix + this.colors.yellow("warn ") + msg);
    }
  }

  error(obj: string | Error) {
    if (this._level !== "silent") {
      if (typeof obj === "string") {
        // eslint-disable-next-line no-console
        console.error(this._prefix + this.colors.red("error ") + obj);
      } else {
        // eslint-disable-next-line no-console
        console.error(this._prefix + this.colors.red("error "), obj);
      }
    }
  }

  verbose(msg: string, ...objects: any[]) {
    if (this._level === "verbose") {
      // eslint-disable-next-line no-console
      console.log(this._prefix + this.colors.green("debug ") + msg);
      if (objects && objects.length) {
        objects.forEach(obj => {
          // eslint-disable-next-line no-console
          console.log(this.colors.gray(JSON.stringify(obj, null, 2)));
        });
      }
    }
  }

  get _prefix() {
    return `[${this._category}] `;
  }
}

export function createLogger(category?: string) {
  return new RegLogger(category);
}
