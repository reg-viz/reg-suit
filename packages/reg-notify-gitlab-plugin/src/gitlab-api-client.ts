import fetch from "node-fetch";

export type ProjectIdType = number;
export type MergeResuestIidType = number;
export type NoteIdType = number;
export type DiscussionIdType = number;

export type MergeRequestResource = {
  iid: MergeResuestIidType;
  description: string;
  web_url: string;
};

export type CommitResource = {
  id: string; // SHA1 string
};

export type NoteResouce = {
  id: NoteIdType;
  body: string;
};

export type DiscussionResource = {
  id: DiscussionIdType;
  notes: NoteResouce[];
};

export type GetMergeRequestsParams = {
  project_id: ProjectIdType;
};

export type PutMergeRequestParams = {
  project_id: ProjectIdType;
  iid: MergeResuestIidType;
  description?: string;
};

export type GetMergeRequestCommitsParams = {
  project_id: ProjectIdType;
  merge_request_iid: MergeResuestIidType;
};

export type GetMergeRequestNotesParams = {
  project_id: ProjectIdType;
  merge_request_iid: MergeResuestIidType;
};

export type PostMergeRequestNoteParams = {
  project_id: ProjectIdType;
  merge_request_iid: MergeResuestIidType;
  body: string;
};

export type PutMergeRequestNoteParams = {
  project_id: ProjectIdType;
  merge_request_iid: MergeResuestIidType;
  note_id: NoteIdType;
  body: string;
};

export type PostMergeRequestDiscussionParams = {
  project_id: ProjectIdType;
  merge_request_iid: MergeResuestIidType;
  body: string;
};

export interface GitLabApiClient {
  getMergeRequests(params: GetMergeRequestsParams): Promise<MergeRequestResource[]>;
  putMergeRequest(params: PutMergeRequestParams): Promise<MergeRequestResource>;
  getMergeRequestCommits(params: GetMergeRequestCommitsParams): Promise<CommitResource[]>;
  getMergeRequestNotes(params: GetMergeRequestNotesParams): Promise<NoteResouce[]>;
  postMergeRequestNote(params: PostMergeRequestNoteParams): Promise<NoteResouce>;
  putMergeRequestNote(params: PutMergeRequestNoteParams): Promise<NoteResouce>;
  postMergeRequestDiscussion(params: PostMergeRequestDiscussionParams): Promise<DiscussionResource>;
}

export class DefaultGitLabApiClient implements GitLabApiClient {
  constructor(private _urlPrefix: string, private _token: string) {}

  async getMergeRequests(params: GetMergeRequestsParams): Promise<MergeRequestResource[]> {
    const res = await fetch(`${this._urlPrefix}/api/v4/projects/${params.project_id}/merge_requests?state=opened`, {
      headers: {
        "Private-Token": this._token,
      },
    });

    return res.json() as any as Promise<MergeRequestResource[]>;
  }

  async putMergeRequest(params: PutMergeRequestParams): Promise<MergeRequestResource> {
    const res = await fetch(`${this._urlPrefix}/api/v4/projects/${params.project_id}/merge_requests/${params.iid}`, {
      method: "PUT",
      headers: {
        "Private-Token": this._token,
      },
      body: JSON.stringify(params),
    });

    return res.json() as any as Promise<MergeRequestResource>;
  }

  async getMergeRequestCommits(params: GetMergeRequestCommitsParams): Promise<CommitResource[]> {
    const res = await fetch(
      `${this._urlPrefix}/api/v4/projects/${params.project_id}/merge_requests/${params.merge_request_iid}/commits`,
      {
        headers: {
          "Private-Token": this._token,
        },
      },
    );
    return res.json() as any as Promise<CommitResource[]>;
  }

  async getMergeRequestNotes(params: GetMergeRequestNotesParams): Promise<NoteResouce[]> {
    const res = await fetch(
      `${this._urlPrefix}/api/v4/projects/${params.project_id}/merge_requests/${params.merge_request_iid}/notes`,
      {
        headers: {
          "Private-Token": this._token,
        },
      },
    );

    return res.json() as any as Promise<NoteResouce[]>;
  }

  async postMergeRequestNote(params: PostMergeRequestNoteParams): Promise<NoteResouce> {
    const res = await fetch(
      `${this._urlPrefix}/api/v4/projects/${params.project_id}/merge_requests/${params.merge_request_iid}/notes`,
      {
        method: "POST",
        headers: {
          "Private-Token": this._token,
        },
        body: JSON.stringify({
          body: params.body,
        }),
      },
    );

    return res.json() as any as Promise<NoteResouce>;
  }

  async putMergeRequestNote(params: PutMergeRequestNoteParams): Promise<NoteResouce> {
    const res = await fetch(
      `${this._urlPrefix}/api/v4/projects/${params.project_id}/merge_requests/${params.merge_request_iid}/notes/${params.note_id}`,
      {
        method: "PUT",
        headers: {
          "Private-Token": this._token,
        },
        body: JSON.stringify({
          body: params.body,
        }),
      },
    );

    return res.json() as any as Promise<NoteResouce>;
  }

  async postMergeRequestDiscussion(params: PostMergeRequestDiscussionParams): Promise<DiscussionResource> {
    const res = await fetch(
      `${this._urlPrefix}/api/v4/projects/${params.project_id}/merge_requests/${params.merge_request_iid}/discussions`,
      {
        method: "POST",
        headers: {
          "Private-Token": this._token,
        },
        body: JSON.stringify({
          body: params.body,
        }),
      },
    );

    return res.json() as any as Promise<DiscussionResource>;
  }
}
