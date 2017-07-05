export interface Logger {
  colors: Colors;
  info(msg: string): void;
  warn(msg: string): void;
  error(msg: string | Error): void;
  verbose(msg: string, ...objects: any[]): void;
}

// See https://www.npmjs.com/package/chalk#colors
export interface Colors {
  black: (s: string) => string;
  red: (s: string) => string;
  green: (s: string) => string;
  yellow: (s: string) => string;
  blue: (s: string) => string;
  magenta: (s: string) => string;
  cyan: (s: string) => string;
  white: (s: string) => string;
  gray: (s: string) => string;
  blackBright: (s: string) => string;
  redBright: (s: string) => string;
  greenBright: (s: string) => string;
  yellowBright: (s: string) => string;
  blueBright: (s: string) => string;
  magentaBright: (s: string) => string;
  cyanBright: (s: string) => string;
  whiteBright: (s: string) => string;
  bgBlack: (s: string) => string;
  bgRed: (s: string) => string;
  bgGreen: (s: string) => string;
  bgYellow: (s: string) => string;
  bgBlue: (s: string) => string;
  bgMagenta: (s: string) => string;
  bgCyan: (s: string) => string;
  bgWhite: (s: string) => string;
  bgBlackBright: (s: string) => string;
  bgRedBright: (s: string) => string;
  bgGreenBright: (s: string) => string;
  bgYellowBright: (s: string) => string;
  bgBlueBright: (s: string) => string;
  bgMagentaBright: (s: string) => string;
  bgCyanBright: (s: string) => string;
  bgWhiteBright: (s: string) => string;
}
