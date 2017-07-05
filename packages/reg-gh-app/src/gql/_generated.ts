/* tslint:disable */
//  This file was automatically generated and should not be edited.

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
