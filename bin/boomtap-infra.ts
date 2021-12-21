#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { LandingPageStack } from "../lib/landingpage-stack";

const app = new cdk.App();

new LandingPageStack(app, "LandingPageStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
