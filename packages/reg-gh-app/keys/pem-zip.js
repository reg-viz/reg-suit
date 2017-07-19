#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const keyPath = path.join(__dirname, "private-key.pem")

function encode() {
  const p = fs.readFileSync(keyPath);
  const x = zlib.deflateSync(p).toString("base64");
  return x;
}

function decode() {
  const v = process.env["GH_APP_PRIVATE_KEY"];
  if (!v) {
    console.error("export GH_APP_PRIVATE_KEY");
    process.exit(1);
  }
  try {
    if (fs.statSync(keyPath)) {
      const x = encode();
      if (x === v) {
        console.log("private-key.pem already exists");
        process.exit(0);
      } else {
        console.warn("private-key.pem already exists, but values are different.");
        process.exit(1);
      }
    }
  } catch (e) {
    const p = zlib.inflateSync(new Buffer(v, "base64"));
    fs.writeFileSync(keyPath, p);
  }
}

if (process.argv[2] === "encode") {
  console.log(encode());
} else {
  decode();
}
