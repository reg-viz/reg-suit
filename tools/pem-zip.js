#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

function encode(keyPath) {
  const p = fs.readFileSync(keyPath);
  const x = zlib.deflateSync(p).toString("base64");
  return x;
}

if (process.argv[2]) {
  console.log(encode(process.argv[2]));
} else {
  console.log(`Usage: ${process.argv[1]} path-to-key.pem`);
}
