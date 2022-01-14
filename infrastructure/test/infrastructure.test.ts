import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import * as Infrastructure from "../bin/infrastructure";

test("SQS Queue and SNS Topic Created", () => {
  const app = new cdk.App();
  // WHEN
  const stack = new Infrastructure.SpaStack(app, "LandingPageStackTest", {});
  // THEN

  const template = Template.fromStack(stack);

  template.hasResourceProperties("AWS::SQS::Queue", {
    VisibilityTimeout: 300,
  });
  template.resourceCountIs("AWS::SNS::Topic", 1);
});
