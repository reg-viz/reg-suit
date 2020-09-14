import rp from "request-promise";

export interface SendOption {
  webhookUrl: string;
  body: string;
  color: string;
}

export function sendWebHook(opt: SendOption): Promise<any> {
  const reqParam: rp.OptionsWithUrl = {
    url: opt.webhookUrl,
    method: "POST",
    json: true,
    body: {
      username: "Reg suit",
      icon_url: "https://raw.githubusercontent.com/reg-viz/artwork/master/logo/reg-viz-transparent_64.png",
      attachments: [
        {
          color: opt.color,
          text: opt.body,
        },
      ],
    },
  };
  return (rp(reqParam) as any) as Promise<any>;
}
