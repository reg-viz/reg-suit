#!/bin/env node

import fs from "fs";
import path from "path";
import { DefaultGitLabApiClient } from "../gitlab-api-client";
import { sync } from "mkdirp";
import { COMMENT_MARK } from "../use-cases";

const projectId = process.env["GITLAB_PROJECT_ID"] as string;
const token = process.env["GITLAB_ACCESS_TOKEN"] as string;

function showUsage() {
  // eslint-disable-next-line no-console
  console.log(`
  Usage:
  ${process.argv[1]} <fixture_name> <merge_request_id>
  or
  ${process.argv[1]} <fixture_name> <merge_request_id> true

  If the 3rd arg is true, this script POST note to target MR and capture the result.
  `);
}

const fixtureName = process.argv[2];
if (!fixtureName) {
  showUsage();
  process.exit(1);
}

const mrId = process.argv[3];
if (!mrId) {
  showUsage();
  process.exit(1);
}

const shouldPost = !!process.argv[4];

function write<T>(data: T, methodName: string) {
  fs.writeFileSync(
    path.join(__dirname, `../../test/fixtures/${fixtureName}`, `${methodName}.json`),
    JSON.stringify(data, null, 2),
    "utf-8",
  );
  return data;
}

async function main() {
  if (!projectId || !token) {
    // eslint-disable-next-line no-console
    console.error("set env value GITLAB_PROJECT_ID and GITLAB_ACCESS_TOKEN.");
    process.exit(1);
    return;
  }
  const client = new DefaultGitLabApiClient("https://gitlab.com", token);

  sync(path.join(__dirname, `../../test/fixtures/${fixtureName}`));

  await client.getMergeRequests({ project_id: +projectId }).then(data => write(data, "getMergeRequests"));
  await client
    .getMergeRequestCommits({ project_id: +projectId, merge_request_iid: +mrId })
    .then(data => write(data, "getMergeRequestCommits"));
  await client
    .getMergeRequestNotes({ project_id: +projectId, merge_request_iid: +mrId })
    .then(data => write(data, "getMergeRequestNotes"));
  if (!shouldPost) return;
  const note = await client
    .postMergeRequestNote({ project_id: +projectId, merge_request_iid: +mrId, body: COMMENT_MARK })
    .then(data => write(data, "postMergeRequestNote"));
  await client
    .putMergeRequestNote({
      project_id: +projectId,
      merge_request_iid: +mrId,
      note_id: note.id,
      body: COMMENT_MARK + "\nupdated",
    })
    .then(data => write(data, "putMergeRequestNote"));
}

main();
