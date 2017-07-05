import * as rp from "request-promise";

const BASIC_HEADERS = {
  "user-agent": "simple-gh-pr-app-example",
};

export function requestWithV3api(path: string, token: string, body?: any) {
  return rp({
    url: "https://api.github.com" + path,
    method: "POST",
    headers: {
      ...BASIC_HEADERS,
      "Authorization": `Bearer ${token}`,
    },
    body,
    json: true,
  });
}
