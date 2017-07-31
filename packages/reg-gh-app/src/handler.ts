/* tslint:disable:no-console */

import { isGhError } from "./error";
import { updateStatus, updateStatusFromWebhook } from "./status-client";
import { commentToPR, commentToPRFromWebhook } from "./pr-comment-client";
import { detectAction } from "./webhook-detect";
import { authWidhCode } from "./auth";

const BASE_RESPONSE = {
  statusCode: 200,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  },
};

function normalResponse(callback: any) {
  return (data: any) => {
    const response = {
      ...BASE_RESPONSE,
      body: JSON.stringify(data),
    };
    callback(null, response);
  };
}

function errorResponse(callback: any) {
  return (reason: any) => {
    if (isGhError(reason)) {
      const errResponse = {
        ...BASE_RESPONSE,
        statusCode: reason.statusCode || 400,
        body: JSON.stringify(reason.body || { message: "An error occurred during calling GitHub API" }),
      };
      if (errResponse.statusCode >= 500) {
        console.error(reason);
      }
      return callback(null, errResponse);
    } else {
      console.error(reason);
      const response = {
        ...BASE_RESPONSE,
        statusCode: 500,
        body: JSON.stringify({ message: "Internal server error." }),
      };
      return callback(null, response);
    }
  };
}

module.exports.ghWebhook = (event: any, context: any, callback: any) => {
  const action = detectAction(event);
  if (!action) {
    normalResponse(callback)({ message: "nothing to do" });
    return;
  }
  switch (action.type) {
    case "pullRequestOpen":
      commentToPRFromWebhook(action.payload).then(normalResponse(callback)).catch(errorResponse(callback));
      break;
    case "pullRequestReview":
      updateStatusFromWebhook(action.payload).then(normalResponse(callback)).catch(errorResponse(callback));
      break;
  }
};

module.exports.login = (event: any, context: any, callback: any) => {
  const p = JSON.parse(event.body);
  authWidhCode(p).then(normalResponse(callback)).catch(errorResponse(callback));
};

module.exports.updateStatus = (event: any, context: any, callback: any) => {
  const p = JSON.parse(event.body);
  updateStatus(p).then(normalResponse(callback)).catch(errorResponse(callback));
};

module.exports.commentToPR = (event: any, context: any, callback: any) => {
  const p = JSON.parse(event.body);
  commentToPR(p).then(normalResponse(callback)).catch(errorResponse(callback));
};

