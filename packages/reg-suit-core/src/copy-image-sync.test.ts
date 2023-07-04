import path from "path";
import fs from "fs";
import { rimrafSync } from "rimraf";
import { copyImagesSync } from "./copy-image-sync";
describe(copyImagesSync, () => {
  beforeAll(() => {
    rimrafSync(path.join(__dirname, "testing/copy-image-fixture/dist/dir-flat"));
    rimrafSync(path.join(__dirname, "testing/copy-image-fixture/dist/dir-nested"));
  });

  it("should copy files from flat dir", () => {
    copyImagesSync(
      path.join(__dirname, "testing/copy-image-fixture/source/dir-flat"),
      path.join(__dirname, "testing/copy-image-fixture/dist/dir-flat"),
    );

    fs.existsSync(path.join(__dirname, "testing/copy-image-fixture/dist/dir-flat/sample01.png"));
  });

  it("should copy files from nested dir", () => {
    copyImagesSync(
      path.join(__dirname, "testing/copy-image-fixture/source/dir-nested"),
      path.join(__dirname, "testing/copy-image-fixture/dist/dir-nested"),
    );

    fs.existsSync(path.join(__dirname, "testing/copy-image-fixture/dist/dir-nested/dir-child/sample01.png"));
  });
});
