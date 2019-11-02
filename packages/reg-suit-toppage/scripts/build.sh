#!/bin/sh
VERSION=$1
DIR=landing-page

if [ -e "$DIR" ]; then
  cd $DIR
  git fetch origin
  git checkout refs/tags/$VERSION
else
  git clone https://github.com/reg-viz/reg-suit-lp.git -b $VERSION $DIR --depth 1
  cd $DIR
fi

yarn install --frozen-lockfile

yarn build

