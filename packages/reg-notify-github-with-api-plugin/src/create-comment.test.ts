import { shortDescription } from "./create-comment";

test("shortDescription is dedented", () => {
  const result = shortDescription({
    shortDescription: true,
    failedItemsCount: 1,
    newItemsCount: 2,
    deletedItemsCount: 3,
    passedItemsCount: 4,
  });

  for (const line of result.split("\n")) {
    expect(line.trimStart()).toBe(line);
  }
});
