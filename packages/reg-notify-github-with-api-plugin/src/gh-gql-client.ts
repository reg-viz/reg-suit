import gql from "graphql-tag";
import { ApolloClient } from "apollo-client";
import { InMemoryCache } from "apollo-cache-inmemory";
import { createHttpLink } from "apollo-link-http";
import fetch from "node-fetch";

const contextQuery = gql`
  query UpdatePrCommentContext($branchName: String!, $owner: String!, $repository: String!) {
    repository(owner: $owner, name: $repository) {
      nameWithOwner
      ref(qualifiedName: $branchName) {
        associatedPullRequests(last: 5, states: OPEN) {
          totalCount
          nodes {
            id
            number
            comments(first: 50) {
              totalCount
              nodes {
                id
                body
              }
            }
          }
        }
      }
    }
  }
`;

type ContextData = {
  repository?: {
    ref?: {
      associatedPullRequests?: {
        totalCount: number;
        nodes: {
          id: string;
          number: number;
          comments?: {
            totalCount: number;
            nodes: {
              id: string;
              body: string;
            }[];
          };
        }[];
      };
    };
  };
};

const createCommentMutation = gql`
  mutation AddCommentMutation($id: ID!, $body: String!) {
    addComment(input: { subjectId: $id, body: $body, clientMutationId: "" }) {
      commentEdge {
        node {
          id
        }
      }
    }
  }
`;

const updateCommentMutation = gql`
  mutation UpdateCommentMutation($id: ID!, $body: String!) {
    updateIssueComment(input: { id: $id, body: $body }) {
      issueComment {
        id
      }
    }
  }
`;

export class GhGqlClient {
  private _client: ApolloClient<any>;

  constructor(token: string, urlStr: string) {
    const url = new URL(urlStr);
    this._client = new ApolloClient({
      link: createHttpLink({
        uri: url.pathname !== "/" ? urlStr : `${urlStr}/api/graphql`,
        headers: {
          Authorization: `bearer ${token}`,
        },
        fetch: fetch as any,
      }),
      cache: new InMemoryCache(),
    });
  }

  async postCommentToPr({
    owner,
    repository,
    branchName,
    body,
  }: {
    owner: string;
    repository: string;
    branchName: string;
    body: string;
  }) {
    const { data, errors } = await this._client.query<
      ContextData,
      { branchName: string; owner: string; repository: string }
    >({
      query: contextQuery,
      variables: {
        owner,
        repository,
        branchName,
      },
    });
    if (!data) {
      throw errors || new Error();
    }

    if (!data || !data.repository) {
      throw new Error(`No matched repository: "${owner}/${repository}"`);
    }
    if (
      !data.repository.ref ||
      !data.repository.ref.associatedPullRequests ||
      !data.repository.ref.associatedPullRequests.totalCount
    ) {
      // Nothing to do
      return;
    }

    const pullRequests = data.repository.ref.associatedPullRequests.nodes;

    await Promise.all(
      pullRequests.map(async pullRequest => {
        if (pullRequest.comments && pullRequest.comments.nodes) {
          const commentToBeUpdated = pullRequest.comments.nodes.find(
            c => c.body && c.body.startsWith("<!-- reg-comment -->"),
          );
          if (commentToBeUpdated) {
            const { errors } = await this._client.mutate({
              mutation: updateCommentMutation,
              variables: {
                id: commentToBeUpdated.id,
                body: `<!-- reg-comment -->\n${body}`,
              },
            });
            if (errors) throw errors;
            return;
          }
        }
        const { errors } = await this._client.mutate({
          mutation: createCommentMutation,
          variables: {
            id: pullRequest.id,
            body: `<!-- reg-comment -->\n${body}`,
          },
        });
        if (errors) throw errors;
        return;
      }),
    );
    return pullRequests.map(p => p.number);
  }
}
