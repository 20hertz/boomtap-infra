#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { FrontEndStack } from "../lib/boomtap-infra-stack";

const app = new cdk.App();

const getConfig = (): Config => {
  const env = app.node.tryGetContext("config");

  if (!env)
    throw new Error(
      "Context variable missing on CDK command. Pass in as `-c config=XXX`"
    );

  return {
    Environment: app.node.tryGetContext(env)["Environment"],
  };
};

interface Config {
  readonly Environment: string;
}

function capitalize(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

const config = getConfig();
const stackName = `FrontEndStack${capitalize(config.Environment)}`;
const stackProps = {
  certificateArn:
    "arn:aws:acm:us-east-1:770668172371:certificate/913a571a-e758-48c7-a6d2-3b3c5191bf91",
  domainName: "boomtap.io",
  envName: config.Environment,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
};
new FrontEndStack(app, stackName, stackProps);
