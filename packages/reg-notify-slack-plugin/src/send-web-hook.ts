import fetch from "node-fetch";

export interface SendOption {
  webhookUrl: string;
  body: string;
  color: string;
}

export async function sendWebHook({ webhookUrl, color, body }: SendOption): Promise<void> {
  const res = await fetch(webhookUrl, {
    method: "POST",
    body: JSON.stringify({
      username: "Reg suit",
      icon_url: "https://raw.githubusercontent.com/reg-viz/artwork/master/logo/reg-viz-transparent_64.png",
      attachments: [
        {
          color: color,
          text: body,
        },
      ],
    }),
  });

  if (400 <= res.status) {
    throw new Error(`HTTP ${res.status}: Failed to send notification to ChatWork. Response: ${await res.json()}`);
  }
}
