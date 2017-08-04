import test from "ava";
import * as React from "react";
import { render, capture } from "../testing/util";
import { Button } from "semantic-ui-react";
import { ClientIdModal, ClientIdModalProps } from "./client-id-modal";
import {
} from "../testing/data";

test.serial("render", async t => {
  const trigger = <Button className="trigger-btn">Click Me</Button>;
  render((
    <ClientIdModal trigger={trigger} clientId="1234567890abcdefg==" repositoryName="sample-repo"/>
  ));
  const btn = document.querySelector(".trigger-btn") as HTMLElement;
  if (!btn) return t.fail();
  btn.click();
  t.truthy(document.querySelector(".client-id-modal"));
  await capture("screenshot/client-id-modal.png", 800);
});
