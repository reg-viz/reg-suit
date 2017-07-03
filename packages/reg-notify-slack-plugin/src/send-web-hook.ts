import * as rp from "request-promise";

export interface SendOption {
  webhookUrl: string;
  body: string;
}

export function sendWebHook(opt: SendOption): Promise<any> {
  const reqParam: rp.OptionsWithUri = {
    uri: opt.webhookUrl,
    method: "POST",
    json: true,
    body: {
      "icon_url": "https://raw.githubusercontent.com/Quramy/reg-suit/master/logo/reglogo_64.png",
      "text": opt.body,
    },
  };
  return rp(reqParam).then(() => Promise.resolve(null));
}
