const fs = require("fs");
const path = require("path");
const glob = require("glob");

const cwd = path.join(__dirname, "..");
glob("packages/*-plugin/package.json", {
  cwd: cwd,
}, (err, list) => {
  const descs = list.map(item => {
    const json = require(path.join(cwd, item));
    return {
      name: json.name,
      description: json.description,
    };
  });
  fs.writeFileSync(path.join(cwd, "packages/reg-suit-cli/well-known-plugins.json"), JSON.stringify(descs, null, 2), "utf8");
})
