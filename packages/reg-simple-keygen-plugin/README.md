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

- `expectedKey` - _Required_ - Identifier key value of the expected(previous) snapshot.
- `actualKey` - _Required_ - Identifier key value of the actual(current) snapshot.

## Example

### Using environment values

Using reg-suit's [replacing environment values feature](https://github.com/reg-viz/reg-suit/blob/master/README.md#embed-environment-values), you can use Git commit sha1 hashes provided with CI service. The following example allows reg-suit to compare HEAD of the master branch with the PR's commit.

```yml
# .travis.yml
script:
  - export EXPECTED_KEY=$(git rev-parse origin/master)
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
