# reg-simple-keygen-plugin
A reg-suit plugin to determine the snapshot key with given values.

## Install

```sh
npm i reg-simple-keygen-plugin -D
```

## Configure

```ts
{
  expectedKey: string;
  actualKey: string;
}
```

- `expectedKey` - *Required* - Identifier key value of the expected(previous) snapshot.
- `actualKey` - *Required* - Identifier key value of the actual(current) snapshot.

## Example
### Using environment values
Using reg-suit's [replacing environment values feature](https://github.com/reg-viz/reg-suit/blob/master/README.md#embed-environment-values), you can use Git commit sha1 hashes provided with CI service. The following example allows reg-suit to compare against the merge-base point on the master branch.

```yml
# .travis.yml
script:
  # Find the merge-base commit between the master branch and the parent of the
  # current commit. That way it will find the correct commit to compare against
  # both when on a branch, or when running this on master itself (in which case
  # it will use the commit's parent commit).
  - export EXPECTED_KEY=$(git merge-base origin/master HEAD^1)
  - export ACTUAL_KEY=$TRAVIS_COMMIT # set by TravisCI
  - reg-suit run
```

```js
  // regconfig.json
  "plugins": {
    "reg-simple-keygen-plugin": {
      "expectedKey": "${EXPECTED_KEY}",
      "actualKey": "${ACTUAL_KEY}"
    },
    ...
  }
```
