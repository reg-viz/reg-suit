import test from "ava";
import { parseGitConfig } from "./git-config-parser";

test("parse from git config file", (t) => {
  const rawConfig = `[core]
	repositoryformatversion = 0
	filemode = true
	bare = false
	logallrefupdates = true
	ignorecase = true
	precomposeunicode = true
[remote "origin"]
	url = https://github.com/Quramy/reg-suit.git
	fetch = +refs/heads/*:refs/remotes/origin/*`;

  const actual = parseGitConfig(rawConfig);
  t.is(actual.length, 2);
  t.is(actual[1].name, "remote \"origin\"");
  t.is(actual[1].keys["url"], "https://github.com/Quramy/reg-suit.git");
});
