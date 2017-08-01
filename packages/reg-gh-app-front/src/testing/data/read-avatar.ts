import * as fs from "fs";
import * as path from "path";

export function readAvatar(name: string) {
  const buf = fs.readFileSync(path.resolve(__dirname, `../../../test/avatar/${name}.png`));
  return "data:image/png;base64," + buf.toString("base64");
}
