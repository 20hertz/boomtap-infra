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
    CertificateArn: app.node.tryGetContext(env)["CertificateArn"],
    DomainName: app.node.tryGetContext(env)["DomainName"],
    Environment: app.node.tryGetContext(env)["Environment"],
  };
};

interface Config {
  readonly CertificateArn: string;
  readonly DomainName: string;
  readonly Environment: string;
}

function capitalize(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

const config = getConfig();
const stackName = `FrontEndStack${capitalize(config.Environment)}`;
const stackProps = {
  certificateArn: config.CertificateArn,
  domainName: config.DomainName,
  envName: config.Environment,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
};
new FrontEndStack(app, stackName, stackProps);
