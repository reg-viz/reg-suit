#!/bin/bash

yarn run webpack
cp serverless.yml serverless.yml.bk
cat serverless.yml.bk | sed "s/- serverless-webpack//" > serverless.yml
yarn run sls -- deploy
mv serverless.yml.bk serverless.yml
