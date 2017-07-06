/* tslint:disable */
//  This file was automatically generated and should not be edited.

// The possible commit status states.
export type StatusState =
  "EXPECTED" | // Status is expected.
  "ERROR" | // Status is errored.
  "FAILURE" | // Status is failing.
  "PENDING" | // Status is pending.
  "SUCCESS"; // Status is successful.


export type StatusDetailQueryVariables = {
  prNumber: number,
};

export type StatusDetailQuery = {
  // The currently authenticated user.
  viewer:  {
    // A list of repositories that the user owns.
    repositories:  {
      // A list of nodes.
      nodes:  Array< {
        // Returns a single pull request from the current repository by number.
        pullRequest:  {
          // A list of commits present in this pull request's head branch not present in the base branch.
          commits:  {
            // A list of nodes.
            nodes:  Array< {
              // The Git commit object
              commit:  {
                // The Git object ID
                oid: string,
                // Status information for this commit
                status:  {
                  // Looks up an individual status context by context name.
                  context:  {
                    // The state of this status context.
                    state: StatusState,
                    // The URL for this status context.
                    targetUrl: string | null,
                  } | null,
                } | null,
              },
            } > | null,
          },
        } | null,
      } > | null,
    },
  },
};

export type UpdatePrCommentContextQueryVariables = {
  branchName: string,
};

export type UpdatePrCommentContextQuery = {
  // The currently authenticated user.
  viewer:  {
    // The username used to login.
    login: string,
    // A list of repositories that the user owns.
    repositories:  {
      // A list of nodes.
      nodes:  Array< {
        // The name of the repository.
        name: string,
        // The User owner of the repository.
        owner: ( {
            // The username used to login.
            login: string,
          } | {
            // The username used to login.
            login: string,
          }
        ),
        // Fetch a given ref from the repository
        ref:  {
          // A list of pull requests with this ref as the head ref.
          associatedPullRequests:  {
            // Identifies the total count of items in the connection.
            totalCount: number,
            // A list of nodes.
            nodes:  Array< {
              id: string,
              // Identifies the pull request number.
              number: number,
              // A list of comments associated with the pull request.
              comments:  {
                // Identifies the total count of items in the connection.
                totalCount: number,
                // A list of nodes.
                nodes:  Array< {
                  // Identifies the primary key from the database.
                  databaseId: number | null,
                  // Identifies the date and time when the object was created.
                  createdAt: string,
                  // Did the viewer author this comment.
                  viewerDidAuthor: boolean,
                } > | null,
              },
            } > | null,
          },
        } | null,
      } > | null,
    },
  },
};

export type UpdateStatusContextQuery = {
  // The currently authenticated user.
  viewer:  {
    // A list of repositories that the user owns.
    repositories:  {
      // A list of nodes.
      nodes:  Array< {
        // The name of the repository.
        name: string,
        // The User owner of the repository.
        owner: ( {
            // The username used to login.
            login: string,
          } | {
            // The username used to login.
            login: string,
          }
        ),
      } > | null,
    },
  },
};
/* tslint:enable */
