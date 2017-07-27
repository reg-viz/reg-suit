import * as jwt from "jsonwebtoken";
import * as rp from "request-promise";
import * as zlib from "zlib";

import { convertError } from "./error";

const appId = process.env["GH_APP_ID"];
const appClientId = process.env["GH_APP_CLIENT_ID"];
const appClientSecret = process.env["GH_APP_CLIENT_SECRET"];
const appCallbackUrl = process.env["GH_APP_AUTH_CALLBACK_URL"];
let pem: string;

function decodePEM() {
  if (pem) return pem;
  const encoded = process.env["GH_APP_PEM_ENCODED"];
  if (!encoded) {
    throw new Error("PEM file is not found.");
  }
  pem = zlib.inflateSync(new Buffer(encoded, "base64")).toString();
  return pem;
}


export function auth(installationId: string) {
  // const pem = fs.readFileSync(pemPath(), "utf-8");
  const iat = ~~(new Date().getTime() / 1000) - 5;
  const exp = iat + 60 * 10;
  const payload = {
    iss: appId,
    iat,
    exp,
  };
  const token = jwt.sign(payload, decodePEM(),  { algorithm: "RS256" });
  const options = {
    method: "POST",
    headers: {
      "User-Agent": "simple-gh-pr-app-example",
      "Authorization": `Bearer ${token}`,
      "Accept": "application/vnd.github.machine-man-preview+json",
    },
    body: {},
    url: `https://api.github.com/installations/${installationId}/access_tokens`,
    json: true,
  };
  return rp(options).then(body => {
    return body["token"] as string;
  }).catch(convertError);
}

export function authWidhCode({ code }: { code: string }) {
  const options = {
    url: "https://github.com/login/oauth/access_token",
    method: "POST",
    headers: {
      "User-Agent": "simple-gh-pr-app-example",
    },
    body: {
      code,
      client_id: appClientId,
      client_secret: appClientSecret,
      redirect_url: appCallbackUrl,
    },
    json: true,
  } as rp.OptionsWithUrl;
  return rp(options).then(x => {
    const token = x.access_token;
    const error = x.error;
    return { token, error };
  });
}
