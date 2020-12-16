import rp from "request-promise";

export interface SendOption {
  roomID: string;
  message: string;
  chatworkToken: string;
}

export function sendWebHook(opt: SendOption): Promise<any> {
  const reqParam: rp.OptionsWithUrl = {
    url: "https://api.chatwork.com/v2/rooms/" + opt.roomID + "/messages",
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-ChatWorkToken": opt.chatworkToken,
    },
    body: "body=" + opt.message,
  };
  return (rp(reqParam) as any) as Promise<any>;
}
