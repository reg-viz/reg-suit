#!/bin/bash

for b in $(aws s3api list-buckets | jq -r ".Buckets[].Name" | grep -e "reg-publish-bucket-"); do
  echo Delete bucket $b
  aws s3 rm s3://$b --recursive
  aws s3api delete-bucket --bucket $b
done
