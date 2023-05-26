import fetch from "node-fetch";

export interface SendOption {
  roomID: string;
  message: string;
  chatworkToken: string;
}

export async function sendWebHook({ roomID, chatworkToken, message }: SendOption): Promise<void> {
  const res = await fetch(`https://api.chatwork.com/v2/rooms/${roomID}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-ChatWorkToken": chatworkToken,
    },
    body: `body=${message}`,
  });

  if (400 <= res.status) {
    throw new Error(`HTTP ${res.status}: Failed to send notification to ChatWork. Response: ${await res.json()}`);
  }
}
