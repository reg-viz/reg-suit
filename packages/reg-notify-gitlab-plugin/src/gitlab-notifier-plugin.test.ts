import { GitLabNotifierPlugin } from "./gitlab-notifier-plugin";
import { RegLogger } from "reg-suit-util";
import { commentToMergeRequests, appendOrUpdateMergerequestsBody, addDiscussionToMergeRequests } from "./use-cases";
import { DefaultGitLabApiClient } from "./gitlab-api-client";

jest.mock("./use-cases", () => ({
  commentToMergeRequests: jest.fn(() => true),
  appendOrUpdateMergerequestsBody: jest.fn(() => true),
  addDiscussionToMergeRequests: jest.fn(() => true),
}));

let notifier = new GitLabNotifierPlugin();

const coreConfig = {
  actualDir: "/actualDir",
  workingDir: "/workingDir",
};

const workingDirs = {
  base: "/baseDir",
  actualDir: "/actualDir",
  expectedDir: "/expectedDir",
  diffDir: "/diffDir",
};

const logger = new RegLogger();

const comparisonResult = {
  actualDir: "",
  diffDir: "",
  expectedDir: "",
  actualItems: [],
  deletedItems: [],
  diffItems: [],
  failedItems: [],
  expectedItems: [],
  newItems: [],
  passedItems: [],
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(logger, "info").mockImplementation(() => {});
  jest.spyOn(logger, "warn").mockImplementation(() => {});

  process.env["CI_PROJECT_URL"] = "";
  process.env["CI_PROJECT_ID"] = "";

  notifier = new GitLabNotifierPlugin();
});

test("initializes without ENV vars", async () => {
  notifier.init({
    coreConfig,
    workingDirs,
    logger,
    options: {
      privateToken: "xxxxxxxxxxx",
    },
    noEmit: false,
  });
  expect(logger.info).not.toBeCalled();
});

test("initializes with ENV var for project URL", async () => {
  process.env["CI_PROJECT_URL"] = "https://project-url-from-env/path";

  notifier.init({
    coreConfig,
    workingDirs,
    logger,
    options: {
      privateToken: "xxxxxxxxxxx",
    },
    noEmit: false,
  });

  expect(logger.info).toBeCalledWith(expect.stringContaining("https://project-url-from-env"));
});

test("initializes with ENV var for project ID", async () => {
  process.env["CI_PROJECT_ID"] = "12345";

  notifier.init({
    coreConfig,
    workingDirs,
    logger,
    options: {
      privateToken: "xxxxxxxxxxx",
    },
    noEmit: false,
  });

  expect(logger.info).toBeCalledWith(expect.stringContaining("12345"));
});

test("initializes with config option for project URL", async () => {
  notifier.init({
    coreConfig,
    workingDirs,
    logger,
    options: {
      privateToken: "xxxxxxxxxxx",
      gitlabUrl: "https://project-url-from-option/path",
    },
    noEmit: false,
  });

  expect(logger.info).not.toBeCalled();
});

test("initializes with config option for project ID", async () => {
  notifier.init({
    coreConfig,
    workingDirs,
    logger,
    options: {
      privateToken: "xxxxxxxxxxx",
      projectId: "98765",
    },
    noEmit: false,
  });

  expect(logger.info).not.toBeCalled();
});

test("does not notify because project ID is missing", async () => {
  notifier.init({
    coreConfig,
    workingDirs,
    logger,
    options: {
      privateToken: "xxxxxxxxxxx",
    },
    noEmit: false,
  });

  notifier.notify({
    expectedKey: "abc",
    actualKey: "def",
    comparisonResult,
  });

  expect(logger.warn).toBeCalledWith(expect.stringContaining("project id is needed"));
});

test("does not notify because token is missing", async () => {
  notifier.init({
    coreConfig,
    workingDirs,
    logger,
    options: {
      privateToken: "",
      projectId: "98765",
    },
    noEmit: false,
  });

  notifier.notify({
    expectedKey: "abc",
    actualKey: "def",
    comparisonResult,
  });

  expect(logger.warn).toBeCalledWith(expect.stringContaining("private access token is needed"));
});

test("sends notification with appendOrUpdateMergerequestsBody", async () => {
  notifier.init({
    coreConfig,
    workingDirs,
    logger,
    options: {
      privateToken: "xxxxx",
      projectId: "98765",
      commentTo: "description",
    },
    noEmit: false,
  });

  const client = new DefaultGitLabApiClient("https://gitlab.com", "xxxxx");

  const notifyParams = {
    expectedKey: "abc",
    actualKey: "def",
    comparisonResult,
  };

  notifier.notify(notifyParams);

  expect(logger.warn).not.toBeCalled();
  expect(appendOrUpdateMergerequestsBody).toBeCalledWith({
    noEmit: false,
    logger,
    client,
    notifyParams,
    projectId: "98765",
  });
});

test("sends notification with commentToMergeRequests", async () => {
  notifier.init({
    coreConfig,
    workingDirs,
    logger,
    options: {
      privateToken: "xxxxx",
      projectId: "98765",
      commentTo: "note",
    },
    noEmit: false,
  });

  const client = new DefaultGitLabApiClient("https://gitlab.com", "xxxxx");

  const notifyParams = {
    expectedKey: "abc",
    actualKey: "def",
    comparisonResult,
  };

  notifier.notify(notifyParams);

  expect(logger.warn).not.toBeCalled();
  expect(commentToMergeRequests).toBeCalledWith({
    noEmit: false,
    logger,
    client,
    notifyParams,
    projectId: "98765",
  });
});

test("sends notification with addDiscussionToMergeRequests", async () => {
  notifier.init({
    coreConfig,
    workingDirs,
    logger,
    options: {
      privateToken: "xxxxx",
      projectId: "98765",
      commentTo: "discussion",
    },
    noEmit: false,
  });

  const client = new DefaultGitLabApiClient("https://gitlab.com", "xxxxx");

  const notifyParams = {
    expectedKey: "abc",
    actualKey: "def",
    comparisonResult,
  };

  notifier.notify(notifyParams);

  expect(logger.warn).not.toBeCalled();
  expect(addDiscussionToMergeRequests).toBeCalledWith({
    noEmit: false,
    logger,
    client,
    notifyParams,
    projectId: "98765",
  });
});
