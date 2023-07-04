import path from "path";
import { copyFileSync, mkdirSync, readdirSync, statSync } from "fs";

const copiedExtensions = [".png", ".jpg", ".jpeg", ".tiff", ".bmp", ".gif"];

export function copyImagesSync(from: string, to: string) {
  const stats = statSync(from);
  if (stats.isDirectory()) {
    for (const inner of readdirSync(from)) {
      copyImagesSync(path.join(from, inner), path.join(to, inner));
    }
  } else if (stats.isFile() && copiedExtensions.some(ext => from.endsWith(ext))) {
    mkdirSync(path.dirname(to), { recursive: true });
    copyFileSync(from, to);
  }
}
