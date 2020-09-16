import { GitLabApiClient } from "./gitlab-api-client";
import { NotifyParams, PluginLogger } from "reg-suit-interface";
import { createCommentBody } from "./create-comment";

export type Context = {
  noEmit: boolean;
  client: GitLabApiClient;
  logger: PluginLogger;
  notifyParams: NotifyParams;
  projectId: string;
};

export const COMMENT_MARK = "<!-- reg-notify-gitlab-plugin posted -->";
export const DESC_BODY_START_MARK = COMMENT_MARK;
export const DESC_BODY_END_MARK = "<!-- reg-notify-gitlab-plugin posted end -->";

function createNoteBody(params: NotifyParams) {
  return (
    COMMENT_MARK +
    "\n" +
    createCommentBody({
      failedItemsCount: params.comparisonResult.failedItems.length,
      newItemsCount: params.comparisonResult.newItems.length,
      deletedItemsCount: params.comparisonResult.deletedItems.length,
      passedItemsCount: params.comparisonResult.passedItems.length,
      reportUrl: params.reportUrl,
    })
  );
}

function modifyDescription(description: string, params: NotifyParams) {
  if (description.indexOf(DESC_BODY_START_MARK) === -1) {
    return (
      description +
      "\n" +
      DESC_BODY_START_MARK +
      "\n" +
      createCommentBody({
        failedItemsCount: params.comparisonResult.failedItems.length,
        newItemsCount: params.comparisonResult.newItems.length,
        deletedItemsCount: params.comparisonResult.deletedItems.length,
        passedItemsCount: params.comparisonResult.passedItems.length,
        reportUrl: params.reportUrl,
      }) +
      "\n" +
      DESC_BODY_END_MARK
    );
  }
  const [pre, tmp] = description.split(DESC_BODY_START_MARK);
  const post = tmp.split(DESC_BODY_END_MARK)![1];
  return (
    pre +
    "\n" +
    DESC_BODY_START_MARK +
    "\n" +
    createCommentBody({
      failedItemsCount: params.comparisonResult.failedItems.length,
      newItemsCount: params.comparisonResult.newItems.length,
      deletedItemsCount: params.comparisonResult.deletedItems.length,
      passedItemsCount: params.comparisonResult.passedItems.length,
      reportUrl: params.reportUrl,
    }) +
    "\n" +
    DESC_BODY_END_MARK +
    "\n" +
    post
  );
}

export async function commentToMergeRequests({ noEmit, logger, client, notifyParams, projectId }: Context) {
  try {
    const mrList = await client.getMergeRequests({ project_id: +projectId });
    if (!mrList.length) {
      logger.warn(
        "There's no opened merge requests. Retry open some merge request including the commit " +
          logger.colors.green(notifyParams.actualKey),
      );
      return;
    }
    const commitsList = await Promise.all(
      mrList.map(async mr => {
        const commits = await client.getMergeRequestCommits({ project_id: +projectId, merge_request_iid: mr.iid });
        return { mr, commits };
      }),
    );

    const targetMrs = commitsList.filter(({ commits }) => commits.some(c => c.id === notifyParams.actualKey));
    if (!targetMrs.length) {
      logger.warn(
        "There's no opened merge requests including the commit " + logger.colors.green(notifyParams.actualKey) + " ...",
      );
      return;
    }

    await Promise.all(
      targetMrs.map(async ({ mr }) => {
        const notes = await client.getMergeRequestNotes({ project_id: +projectId, merge_request_iid: mr.iid });
        const commentedNote = notes.find(note => note.body.startsWith(COMMENT_MARK));
        const spinner = logger.getSpinner("commenting merge request" + logger.colors.magenta(mr.web_url));
        spinner.start();
        try {
          if (!commentedNote) {
            if (!noEmit) {
              await client.postMergeRequestNote({
                project_id: +projectId,
                merge_request_iid: mr.iid,
                body: createNoteBody(notifyParams),
              });
            }
          } else {
            if (!noEmit) {
              await client.putMergeRequestNote({
                project_id: +projectId,
                merge_request_iid: mr.iid,
                note_id: commentedNote.id,
                body: createNoteBody(notifyParams),
              });
            }
          }
          spinner.stop();
        } catch (err) {
          spinner.stop();
          throw err;
        }
      }),
    );
  } catch (error) {
    throw error;
  }
}

export async function addDiscussionToMergeRequests({ noEmit, logger, client, notifyParams, projectId }: Context) {
  try {
    const mrList = await client.getMergeRequests({ project_id: +projectId });
    if (!mrList.length) {
      logger.warn(
        "There's no opened merge requests. Retry open some merge request including the commit " +
          logger.colors.green(notifyParams.actualKey),
      );
      return;
    }
    const commitsList = await Promise.all(
      mrList.map(async mr => {
        const commits = await client.getMergeRequestCommits({ project_id: +projectId, merge_request_iid: mr.iid });
        return { mr, commits };
      }),
    );

    const targetMrs = commitsList.filter(({ commits }) => commits.some(c => c.id === notifyParams.actualKey));
    if (!targetMrs.length) {
      logger.warn(
        "There's no opened merge requests including the commit " + logger.colors.green(notifyParams.actualKey) + " ...",
      );
      return;
    }

    await Promise.all(
      targetMrs.map(async ({ mr }) => {
        const notes = await client.getMergeRequestNotes({ project_id: +projectId, merge_request_iid: mr.iid });
        const commentedNote = notes.find(note => note.body.startsWith(COMMENT_MARK));
        const spinner = logger.getSpinner("commenting merge request" + logger.colors.magenta(mr.web_url));
        spinner.start();
        try {
          if (!commentedNote) {
            if (!noEmit) {
              await client.postMergeRequestDiscussion({
                project_id: +projectId,
                merge_request_iid: mr.iid,
                body: createNoteBody(notifyParams),
              });
            }
          } else {
            if (!noEmit) {
              await client.putMergeRequestNote({
                project_id: +projectId,
                merge_request_iid: mr.iid,
                note_id: commentedNote.id,
                body: createNoteBody(notifyParams),
              });
            }
          }
          spinner.stop();
        } catch (err) {
          spinner.stop();
          throw err;
        }
      }),
    );
  } catch (error) {
    throw error;
  }
}

export async function appendOrUpdateMergerequestsBody({ noEmit, logger, client, notifyParams, projectId }: Context) {
  try {
    const mrList = await client.getMergeRequests({ project_id: +projectId });
    if (!mrList.length) {
      logger.warn(
        "There's no opened merge requests. Retry open some merge request including the commit " +
          logger.colors.green(notifyParams.actualKey),
      );
      return;
    }
    const commitsList = await Promise.all(
      mrList.map(async mr => {
        const commits = await client.getMergeRequestCommits({ project_id: +projectId, merge_request_iid: mr.iid });
        return { mr, commits };
      }),
    );

    const targetMrs = commitsList.filter(({ commits }) => commits.some(c => c.id === notifyParams.actualKey));
    if (!targetMrs.length) {
      logger.warn(
        "There's no opened merge requests including the commit " + logger.colors.green(notifyParams.actualKey) + " ...",
      );
      return;
    }

    await Promise.all(
      targetMrs.map(async ({ mr }) => {
        const newDescription = modifyDescription(mr.description, notifyParams);
        const spinner = logger.getSpinner("commenting merge request" + logger.colors.magenta(mr.web_url));
        spinner.start();
        try {
          if (!noEmit) {
            await client.putMergeRequest({
              project_id: +projectId,
              iid: mr.iid,
              description: newDescription,
            });
          }
          spinner.stop();
        } catch (err) {
          spinner.stop();
          throw err;
        }
      }),
    );
  } catch (error) {
    throw error;
  }
}
