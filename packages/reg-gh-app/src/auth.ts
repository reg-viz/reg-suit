// import * as fs from "fs";
// import * as path from "path";
import * as jwt from "jsonwebtoken";
import * as rp from "request-promise";

import { convertError } from "./error";

// function pemPath() {
//   if (process.env.NODE_ENV === "DEV") {
//     return path.join(__dirname, "../../keys/private-key.pem");
//   } else {
//     return path.join(__dirname, "private-key.pem");
//   }
// }

const PEM = require("../keys/private-key.pem") as string;

export function auth(installationId: string) {
  // const pem = fs.readFileSync(pemPath(), "utf-8");
  const iat = ~~(new Date().getTime() / 1000) - 5;
  const exp = iat + 60 * 10;
  const payload = {
    iss: 3180,
    iat,
    exp,
  };
  const token = jwt.sign(payload, PEM,  { algorithm: "RS256" });
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

export function authWidhCode(opt: { code: string, callbackUrl: string }) {
  const clientId = process.env["APP_CLIENT_ID"];
  const clientSecret = process.env["APP_CLIENT_SECRET"];
  const options = {
    url: "https://github.com/login/oauth/access_token",
    method: "POST",
    headers: {
      "User-Agent": "simple-gh-pr-app-example",
    },
    body: {
      code: opt.code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_url: opt.callbackUrl,
    },
    json: true,
  } as rp.OptionsWithUrl;
  return rp(options).then(x => {
    const token = x.access_token;
    const error = x.error;
    return { token, error };
  });
}
