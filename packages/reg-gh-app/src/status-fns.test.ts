import test from "ava";
import {
  createStatusDetailQueryVariables,
  decodeMetadata,
  encodeMetadata,
} from "./status-fns";

test("createStatusDetailQueryVariables from captured payload", t => {
  const payload = require("../test/webhook/review/payload_pr01.json");
  const variables = createStatusDetailQueryVariables(payload);
  if (!variables) return t.fail();
  t.truthy(variables.prNumber);
  t.truthy(variables.owner);
  t.truthy(variables.repository);
});

test("tokenize metadata", t => {
  const encoded = encodeMetadata({
    failedItemsCount: 10,
    newItemsCount: 11,
    deletedItemsCount: 12,
    passedItemsCount: 13,
  });
  t.deepEqual(decodeMetadata(encoded), {
    failedItemsCount: 10,
    newItemsCount: 11,
    deletedItemsCount: 12,
    passedItemsCount: 13
  });
});
