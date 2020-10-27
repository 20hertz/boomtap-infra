import {
  expect as expectCDK,
  matchTemplate,
  MatchStyle,
} from "@aws-cdk/assert";
import * as cdk from "@aws-cdk/core";
import * as PlaygroundInfra from "../lib/playground-infra-stack";

test("Empty Stack", () => {
  const app = new cdk.App();
  // WHEN
  const stack = new PlaygroundInfra.FrontEndStack(app, "MyTestStack");
  // THEN
  expectCDK(stack).to(
    matchTemplate(
      {
        Resources: {},
      },
      MatchStyle.EXACT
    )
  );
});
