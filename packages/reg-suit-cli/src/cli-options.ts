export interface CliOptions {
  command: string;
  configFileName?: string;
  logLevel: "verbose" | "info" | "silent";
  noEmit: boolean;
  npmClient: "npm" | "yarn";
  plugins: string[];
  notification: boolean;
  noInstallCore: boolean;
}
