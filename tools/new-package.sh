#!/bin/bash

BASE_DIR=$(cd $(dirname $0); pwd)/..

PKG_NAME=$1

if [ -z "$PKG_NAME" ]; then
  echo "Usage $0 <package_name>"
  exit 0
fi

PKG_DIR=$BASE_DIR/packages/$PKG_NAME
VERSION=$(cat $BASE_DIR/lerna.json | jq -r .version)

mkdir -p $PKG_DIR
mkdir -p $PKG_DIR/src

cat << JSON > $PKG_DIR/package.json
{
  "name": "$PKG_NAME",
  "version": "$VERSION",
  "description": "",
  "main": "lib/index.js",
  "scripts": {
    "test": "echo T.B.D.",
    "prepublish": "tsc -p tsconfig.build.json"
  },
  "keywords": [
    "reg"
  ],
  "author": {
    "name": "Quramy",
    "email": "yosuke.kurami@gmail.com"
  },
  "repository": "git+https://github.com/reg-viz/reg-suit.git",
  "license": "MIT",
  "devDependencies": {
    "typescript": "3.9.7"
  },
  "dependencies": {
  }
}
JSON

cat << JSON > $PKG_DIR/tsconfig.build.json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "lib"
  },
  "exclude": ["lib", "e2e"]
}
JSON

cat << JSON > $PKG_DIR/tsconfig.json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
  },
  "exclude": ["lib", "e2e"]
}
JSON

cat << TYPESCRIPT > $PKG_DIR/src/index.ts
console.log("hello, $PKG_NAME");
TYPESCRIPT

cat << MARKDOWN > $PKG_DIR/README.md
# $PKG_NAME

*T.B.D.*
MARKDOWN

cat << IGNORE > $PKG_DIR/.gitignore
node_modules/
lib/
IGNORE

cat << IGNORE > $PKG_DIR/.npmignore
yarn.lock
lib/**/*.test.js
lib/**/*.spec.js
lib/**/*.test.d.ts
lib/**/*.spec.d.ts
src/
test/
e2e/
built_e2e/
built/
IGNORE
