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
  };
  pull_request: {
    number: number;
  };
}

const EventTypeKey = "X-GitHub-Event";

export interface PullRequestReviewAction {
  type: "pullRequestReview";
  payload: PullRequestReviewPayload;
}

export type WebhookAction = PullRequestReviewAction;

export function detectAction(event: { headers?: { [key: string]: string }, body?: string }): WebhookAction | null {
  if (!event || !event.body) return null;
  if (event && event.headers && event.headers[EventTypeKey]) {
    const t = event.headers[EventTypeKey];
    switch (t) {
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
