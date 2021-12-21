#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { LandingPageStack } from "../lib/landingpage-stack";
import { InfraStack } from "../lib/infra-stack";

const app = new cdk.App();

new InfraStack(app, "InfraStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

new LandingPageStack(app, "LandingPageStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
