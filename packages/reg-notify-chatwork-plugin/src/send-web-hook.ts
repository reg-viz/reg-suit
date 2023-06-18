import { fetch } from "undici";

export interface SendOption {
  roomID: string;
  message: string;
  chatworkToken: string;
}

export async function sendWebHook(opt: SendOption): Promise<void> {
  const res = await fetch(`https://api.chatwork.com/v2/rooms/${opt.roomID}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-ChatWorkToken": opt.chatworkToken,
    },
    body: `body=${opt.message}`,
  });

  if (400 <= res.status) {
    throw new Error(`HTTP ${res.status}: Failed to send notification to ChatWork. Response: ${await res.json()}`);
  }
}
