#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { FrontEndStack } from "../lib/boomtap-infra-stack";

const envProd = {
  certificateArn:
    "arn:aws:acm:us-east-1:770668172371:certificate/913a571a-e758-48c7-a6d2-3b3c5191bf91",
  domainName: "boomtap.io",
  env: "prod",
};

const app = new cdk.App();

new FrontEndStack(app, "FrontEndStackProd", envProd);
