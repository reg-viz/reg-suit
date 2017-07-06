/* tslint:disable */
//  This file was automatically generated and should not be edited.

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
                  // Identifies the comment body.
                  body: string,
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
