export interface CliOptions {
  command: string;
  configFileName?: string;
  logLevel: "verbose" | "info" | "silent";
  noEmit: boolean;
  npmClient: "npm" | "yarn" | "yarn workspace" | "pnpm";
  plugins: string[];
  notification: boolean;
  noInstallCore: boolean;
}
