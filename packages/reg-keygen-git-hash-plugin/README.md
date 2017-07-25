# reg-keygen-git-hash-plugin

A reg-suit plugin to determine the snapshot key with Git commit hash.

## Install

```sh
npm i reg-keygen-git-hash-plugin -D
reg-suit prepare -p keygen-git-hash
```

## Detection expected commit
### Base commit
By the default, this plugin detects automatically the parent's commit which is the source of the topic branch. And use the snapshot result of the detected commit as the expected result of regression testing.

![](images/gh_flow.png)

And if your topic branch has the merge commit from the parent(i.e. `master`) branch, this plugin uses this merge commit hash as the expected snapshot key.

### Arbitrary Git commit object
Alternatively, you can use the arbitrary commit hash as the expected key with `"expectedType": "rev"`. For example if you want to fetch images which were registered from `origin/master` HEAD as the expected snapshot result, this plugin could be configured as the following:

```json
  "plugins": {
    "reg-keygen-git-hash-plugin": {
      "expectedType": "rev",
      "expectedRev": "origin/master"
    }
  }
```

## Configure

```ts
{
  expectedType?: string;
  expectedRev?: string;
}
```

- `expectedType` - *Optional* - How to detect expected key. Set value `"base-commit"`(default) or `"rev"`.
- `expectedRev` - *Optional* - Commit hash or tag name. When `expectedType` is `"rev"`, this should be set and will be passed through `git rev-parse` command.
