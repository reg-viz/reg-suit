/* tslint:disable:no-console */

// import { updateReview } from "./review-client";
import { GithubApiError, isGhError } from "./error";
import { updateStatus } from "./status-client";

const BASE_RESPONSE = {
  statusCode: 200,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  },
};

function createNormalResponse(callback: any) {
  return (data: any) => {
    const response = {
      ...BASE_RESPONSE,
      body: JSON.stringify(data),
    };
    callback(null, response);
  };
}

function createErrorResponse(callback: any) {
  return (reason: any) => {
    console.error(reason);
    if (isGhError(reason)) {
      const errResponse = {
        ...BASE_RESPONSE,
        statusCode: reason.statusCode || 400,
        body: reason.body || { message: "An error occurred during calling GitHub API" },
      };
      return callback(null, errResponse);
    } else {
      const response = {
        ...BASE_RESPONSE,
        statusCode: 500,
        body: { message: "Internal server error" },
      };
      return callback(null, response);
    }
  };
}

module.exports.updateStatus = (event: any, context: any, callback: any) => {
  const p = JSON.parse(event.body);
  updateStatus(p).then(createNormalResponse(callback)).catch(createErrorResponse(callback));
};
