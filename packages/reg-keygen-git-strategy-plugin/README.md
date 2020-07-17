# reg-keygen-git-strategy-plugin

A reg-suit plugin to detect commit hash accomplishing next objectives:

- OBJECTIVE 1: Local comparison when you are on a regular branch
- OBJECTIVE 2: Global comparision when you are in a protected branch

## OBJECTIVE 1 :: Local comparision

Basically what we want to achieve here is obtain commit hash of first resource available before checking out.

## OBJECTIVE 2 :: Blobal comparision

Once our MR is merged, just in case other branches were merged before, we need to check images comparing with the first commit available having snapshots for avoiding or missing changes. This is done using --first-parent techinque which filters commits merged from branches and only shows merge commits and regular commits done on the marked secured branch.

## Install

```sh
yarn add -D reg-keygen-git-strategy-plugin -D
```
