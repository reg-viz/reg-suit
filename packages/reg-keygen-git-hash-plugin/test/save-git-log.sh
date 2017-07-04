#!/bin/bash

BASE_DIR=$(cd $(dirname $0); pwd)
FIXTURE_NAME=$1
FIXTURE_DIR=$BASE_DIR/fixture/$1

if [ -z "$1" ]; then
  echo 1 argument required
  exit 1
fi

mkdir -p $FIXTURE_DIR

echo capture $FIXTURE_DIR/current-name.txt
git branch | grep "^\*" | cut -b 3- > $FIXTURE_DIR/current-name.txt

echo capture $FIXTURE_DIR/show-branch.txt
git show-branch -a --sha1-name > $FIXTURE_DIR/show-branch.txt

echo capture $FIXTURE_DIR/log-first-parent.txt
git log -n 1000 --oneline > $FIXTURE_DIR/log-first-parent.txt

echo capture $FIXTURE_DIR/log-graph.txt
git log -n 1000 --graph --pretty=format:"%h %p" > $FIXTURE_DIR/log-graph.txt

for b in $(git branch --list | cut -b 3-); do
  echo capture $FIXTURE_DIR/rev-parse_$b.txt
  git rev-parse $b > $FIXTURE_DIR/rev-parse_$b.txt
done

for b in $(git log -n 100 --oneline | cut -f 1 -d " "); do
  echo capture $FIXTURE_DIR/rev-parse_$b.txt
  git rev-parse $b > $FIXTURE_DIR/rev-parse_$b.txt
done
