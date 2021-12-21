import {
  expect as expectCDK,
  matchTemplate,
  MatchStyle,
} from "@aws-cdk/assert";
import * as cdk from "aws-cdk-lib";
import * as BoomtapInfra from "../lib/landingpage-stack";

test("Empty Stack", () => {
  const app = new cdk.App();
  // WHEN
  const stack = new BoomtapInfra.LandingPageStack(app, "TestLandingPageStack");
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
