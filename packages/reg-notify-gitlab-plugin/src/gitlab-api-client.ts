export type ProjectIdType = number;
export type MergeResuestIidType = number;
export type NoteIdType = number;
export type DiscussionIdType = number;
import rp from "request-promise";

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

  getMergeRequests(params: GetMergeRequestsParams): Promise<MergeRequestResource[]> {
    const reqParam: rp.OptionsWithUrl = {
      method: "GET",
      url: `${this._urlPrefix}/api/v4/projects/${params.project_id}/merge_requests?state=opened`,
      json: true,
      headers: {
        "Private-Token": this._token,
      },
    };
    return (rp(reqParam) as any) as Promise<MergeRequestResource[]>;
  }

  putMergeRequest(params: PutMergeRequestParams): Promise<MergeRequestResource> {
    const reqParam: rp.OptionsWithUrl = {
      method: "PUT",
      url: `${this._urlPrefix}/api/v4/projects/${params.project_id}/merge_requests/${params.iid}`,
      json: true,
      headers: {
        "Private-Token": this._token,
      },
      body: params,
    };
    return (rp(reqParam) as any) as Promise<MergeRequestResource>;
  }

  getMergeRequestCommits(params: GetMergeRequestCommitsParams): Promise<CommitResource[]> {
    const reqParam: rp.OptionsWithUrl = {
      method: "GET",
      url: `${this._urlPrefix}/api/v4/projects/${params.project_id}/merge_requests/${params.merge_request_iid}/commits`,
      json: true,
      headers: {
        "Private-Token": this._token,
      },
    };
    return (rp(reqParam) as any) as Promise<CommitResource[]>;
  }

  getMergeRequestNotes(params: GetMergeRequestNotesParams): Promise<NoteResouce[]> {
    const reqParam: rp.OptionsWithUrl = {
      method: "GET",
      url: `${this._urlPrefix}/api/v4/projects/${params.project_id}/merge_requests/${params.merge_request_iid}/notes`,
      json: true,
      headers: {
        "Private-Token": this._token,
      },
    };
    return (rp(reqParam) as any) as Promise<NoteResouce[]>;
  }

  postMergeRequestNote(params: PostMergeRequestNoteParams): Promise<NoteResouce> {
    const reqParam: rp.OptionsWithUrl = {
      method: "POST",
      url: `${this._urlPrefix}/api/v4/projects/${params.project_id}/merge_requests/${params.merge_request_iid}/notes`,
      json: true,
      headers: {
        "Private-Token": this._token,
      },
      body: {
        body: params.body,
      },
    };
    return (rp(reqParam) as any) as Promise<NoteResouce>;
  }

  putMergeRequestNote(params: PutMergeRequestNoteParams): Promise<NoteResouce> {
    const reqParam: rp.OptionsWithUrl = {
      method: "PUT",
      url: `${this._urlPrefix}/api/v4/projects/${params.project_id}/merge_requests/${params.merge_request_iid}/notes/${params.note_id}`,
      json: true,
      headers: {
        "Private-Token": this._token,
      },
      body: {
        body: params.body,
      },
    };
    return (rp(reqParam) as any) as Promise<NoteResouce>;
  }

  postMergeRequestDiscussion(params: PostMergeRequestDiscussionParams): Promise<DiscussionResource> {
    const reqParam: rp.OptionsWithUrl = {
      method: "POST",
      url: `${this._urlPrefix}/api/v4/projects/${params.project_id}/merge_requests/${params.merge_request_iid}/discussions`,
      json: true,
      headers: {
        "Private-Token": this._token,
      },
      body: {
        body: params.body,
      },
    };
    return (rp(reqParam) as any) as Promise<DiscussionResource>;
  }
}
