import * as fs from "fs";
import * as path from "path";
import * as rp from "request-promise";
import { convertError } from "./error";

const BASIC_HEADERS = {
  "user-agent": "simple-gh-pr-app-example",
};

const URL = "https://api.github.com/graphql";

let _captSeq = 0;
function captureResponse(req: any) {
  if (process.env["NODE_ENV"] !== "DEV") return (data: any) => Promise.resolve(data);
  _captSeq++;
  const seq = _captSeq;
  const st = Date.now();
  return (data: any) => {
    const end = Date.now();
    return new Promise((resolve, reject) => {
      const journalChunk: string[] = [];
      journalChunk.push(`# Request req_${seq}`);
      journalChunk.push(JSON.stringify(req, null, 2) + "\n");
      journalChunk.push(`# Response req_${seq}, elapse time: ${end-st} [msec]`);
      journalChunk.push(JSON.stringify(data, null, 2) + "\n");
      fs.appendFile(path.resolve(__dirname, "../response.capture.log"), journalChunk.join("\n"), err => {
        if (err) {
          return reject(err);
        } else {
          return resolve(data);
        }
      });
    });
  };
}

export function gqlRequest(query: string, token: string, variables?: any) {
  const request: rp.OptionsWithUrl = {
    url: URL,
    method: "POST",
    headers: {
      ...BASIC_HEADERS,
      "Authorization": `Bearer ${token}`,
    },
    body: {
      query,
      variables: variables ? JSON.stringify(variables) : "",
    },
    json: true,
  };
  return rp(request).then(captureResponse(request));
}

export function requestWithV3api(token: string, method: "POST" | "PATCH", path: string, body?: any) {
  const request: rp.OptionsWithUrl = {
    url: "https://api.github.com" + path,
    method,
    headers: {
      ...BASIC_HEADERS,
      "Authorization": `Bearer ${token}`,
    },
    body,
    json: true,
  };
  return rp(request).then(captureResponse(request)).catch(convertError);
}

export class GhApiClient {
  constructor(private _token: string) {
  }

  requestWithGraphQL(query: string, variables?: any) {
    return gqlRequest(query, this._token, variables);
  }

  requestWithRestAPI(path: string, method: "POST" | "PATCH", body: any) {
    return requestWithV3api(this._token, method, path, body);
  }

  get(path: string) {
  }

  post(path: string, body?: any) {
    return requestWithV3api(this._token, "POST", path, body);
  }

  patch(path: string, body: any) {
    return requestWithV3api(this._token, "PATCH", path, body);
  }
}
