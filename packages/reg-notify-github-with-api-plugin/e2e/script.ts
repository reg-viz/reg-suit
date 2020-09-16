/* eslint-disable no-console */
import { GhGqlClient } from "../src/gh-gql-client";

require("dotenv").config();

async function main() {
  const GH_URL = "https://api.github.com/graphql";
  const GH_API_TOKEN = process.env.GH_API_TOKEN;
  const GH_OWNER = process.env.GH_OWNER;
  const GH_REPO = process.env.GH_REPO;
  const GH_BRANCH = process.env.GH_BRANCH;

  if (!GH_API_TOKEN) {
    return console.warn("GH_API_TOKEN is not set, skip this script");
  } else if (!GH_OWNER) {
    return console.warn("GH_OWNER is not set, skip this script");
  } else if (!GH_REPO) {
    return console.warn("GH_REPO is not set, skip this script");
  } else if (!GH_BRANCH) {
    return console.warn("GH_BRANCH is not set, skip this script");
  }

  const client = new GhGqlClient(GH_API_TOKEN, GH_URL);

  try {
    const prNums = await client.postCommentToPr({
      owner: GH_OWNER,
      repository: GH_REPO,
      branchName: GH_BRANCH,
      body: "test from reg-notify-github-with-api-plugin",
    });
    console.log(
      "PRs commented",
      prNums?.map(n => `${GH_OWNER}/${GH_REPO}/pull/${n}`),
    );
    console.log(" 🌟  Test was ended successfully! 🌟 ");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
