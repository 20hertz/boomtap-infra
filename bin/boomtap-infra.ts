#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { FrontEndStack } from "../lib/boomtap-infra-stack";

const stackNameSuffix = "Prod";

const stackProps = {
  certificateArn:
    "arn:aws:acm:us-east-1:770668172371:certificate/913a571a-e758-48c7-a6d2-3b3c5191bf91",
  domainName: "boomtap.io",
  envName: "prod",
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
};

const app = new cdk.App();

new FrontEndStack(app, `FrontEndStack${stackNameSuffix}`, stackProps);
