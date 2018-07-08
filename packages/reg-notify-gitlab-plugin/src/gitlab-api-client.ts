export type ProjectIdType = number;
export type MergeResuestIidType = number;
export type NoteIdType = number;
import * as rp from "request-promise";

export type MergeRequestResource = {
  id: MergeResuestIidType;
  web_url: string;
};

export type CommitResource = {
  id: string; // SHA1 string
};

export type NoteResouce = {
  id: NoteIdType;
  body: string;
};

export type GetMergeRequestsParams = {
  project_id: ProjectIdType;
}

export type GetMergeRequestCommitsParams = {
  project_id: ProjectIdType;
  merge_request_iid: MergeResuestIidType;
}

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

export interface GitLabApiClient {
  getMergeRequests(params: GetMergeRequestsParams): Promise<MergeRequestResource[]>;
  getMergeRequestCommits(params: GetMergeRequestCommitsParams): Promise<CommitResource[]>;
  getMergeRequestNotes(params: GetMergeRequestNotesParams): Promise<NoteResouce[]>;
  postMergeRequestNote(params: PostMergeRequestNoteParams): Promise<NoteResouce>;
  putMergeRequestNote(params: PutMergeRequestNoteParams): Promise<NoteResouce>;
}

export class DefaultGitLabApiClient implements GitLabApiClient {
  constructor(
    private _urlPrefix: string,
    private _token: string,
  ) { }

  getMergeRequests(params: GetMergeRequestsParams): Promise<MergeRequestResource[]> {
    const reqParam: rp.OptionsWithUrl = {
      method: "GET",
      url: `${this._urlPrefix}/api/v4/projects/${params.project_id}/merge_requests`,
      json: true,
      headers: {
        "Private-Token": this._token,
      }
    };
    return (rp(reqParam) as any) as Promise<MergeRequestResource[]>;
  }

  getMergeRequestCommits(params: GetMergeRequestCommitsParams): Promise<CommitResource[]> {
    const reqParam: rp.OptionsWithUrl = {
      method: "GET",
      url: `${this._urlPrefix}/api/v4/projects/${params.project_id}/merge_requests/${params.merge_request_iid}/commits`,
      json: true,
      headers: {
        "Private-Token": this._token,
      }
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
      }
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
        "body": params.body,
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
        "body": params.body,
      },
    };
    return (rp(reqParam) as any) as Promise<NoteResouce>;
  }

}
