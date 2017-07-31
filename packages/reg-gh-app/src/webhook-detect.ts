import * as fs from "fs";
import * as path from "path";

export interface PullRequestOpenPayload {
  installation: {
    id: string;
  };
  review: undefined;
  repository: {
    name: string;
    full_name: string;
    owner: {
      login: string;
    };
  };
  pull_request: {
    number: number;
    head: {
      label: string;
      ref: string;
      sha: string;
    };
  };
}

export interface PullRequestReviewPayload {
  installation: {
    id: string;
  };
  review: {
    state: "approved" | "changes_requested";
    commit_id: string;
  };
  repository: {
    name: string;
    full_name: string;
    owner: {
      login: string;
    };
  };
  pull_request: {
    number: number;
  };
}

// FIXME which one is correct?
const EventTypeKey1 = "X-GitHub-Event";
const EventTypeKey2 = "X-Github-Event";

export interface PullRequestOpenAction {
  type: "pullRequestOpen";
  payload: PullRequestOpenPayload;
}

export interface PullRequestReviewAction {
  type: "pullRequestReview";
  payload: PullRequestReviewPayload;
}

export type WebhookAction = PullRequestOpenAction | PullRequestReviewAction;

export function detectAction(event: { headers?: { [key: string]: string }, body?: string }): WebhookAction | null {
  if (process.env["NODE_ENV"] === "DEV" && event && event.headers) {
    const payloadPath = event.headers["X-Dev-Payload-Path"];
    event.body = fs.readFileSync(path.join(__dirname, "..", payloadPath), "utf8") as string;
  }
  if (!event || !event.body) return null;
  if (event && event.headers && (event.headers[EventTypeKey1] || event.headers[EventTypeKey2])) {
    const t = event.headers[EventTypeKey1] || event.headers[EventTypeKey2];
    switch (t) {
      case "pull_request":
        const payload = JSON.parse(event.body);
        if (payload["action"] !== "opened") return null;
        return {
          type: "pullRequestOpen",
          payload,
        } as PullRequestOpenAction;
      case "pull_request_review":
        return {
          type: "pullRequestReview",
          payload: JSON.parse(event.body),
        } as PullRequestReviewAction;
      default:
        return null;
    }
  }
  return null;
}
