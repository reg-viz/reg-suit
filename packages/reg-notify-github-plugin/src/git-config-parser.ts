import fs from "fs";
import path from "path";

import { fsUtil } from "reg-suit-util";

export interface ConfigSection {
  name: string;
  keys: { [key: string]: string };
}

export function readGitConfig() {
  const prjRoot = fsUtil.lookup(".git");
  if (!prjRoot) return;
  try {
    const file = fs.readFileSync(path.join(prjRoot, "config"), "utf-8") as string;
    return file;
  } catch (e) {
    return;
  }
}

export function parseGitConfig(file: string) {
  const lines = file.split("\n");
  const sections: ConfigSection[] = [];
  let currentSection: ConfigSection;
  lines.forEach(line => {
    const sectionStartHit = line.match(/^\s*\[([^\]]+)\]/);
    if (sectionStartHit) {
      currentSection = { name: sectionStartHit[1], keys: {} };
      sections.push(currentSection);
    } else {
      const keyValueHit = line.match(/^\s*([^\s=]+)\s*=\s*([^\s]*)/);
      if (keyValueHit) {
        currentSection.keys[keyValueHit[1]] = keyValueHit[2];
      }
    }
  });
  return sections;
}
