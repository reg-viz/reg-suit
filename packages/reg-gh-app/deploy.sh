#!/bin/bash

yarn run webpack -- --config webpack.config.prod.js
cp serverless.yml serverless.yml.bk
cat serverless.yml.bk | sed "s/- serverless-webpack//" > serverless.yml
yarn run sls -- deploy
code=$?
mv serverless.yml.bk serverless.yml
if [ "$code" -gt 0 ]; then
  exit $code
fi
apiEndpoint=$(./node_modules/.bin/sls info | grep POST - | head -n 1 | cut -b 10- | sed "s/\/api.*//")
echo "export GH_APP_API_ENDPOINT=$apiEndpoint" > .endpoint
cat << JSON > ../reg-notify-github-plugin/.endpoint.json
{ "endpoint": "$apiEndpoint" }
JSON
