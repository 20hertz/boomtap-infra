// #!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { FrontEndStack, FrontEndStackNew } from "../lib/boomtap-infra-stack";

const app = new cdk.App();

new FrontEndStackNew(app, 'FrontEndStackNew', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  }
});



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
    "arn:aws:acm:us-east-1:770668172371:certificate/9be2040c-0954-4749-aa32-80bd8d08d4c2",
  domainName: "boomtap.io",
  envName: config.Environment,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
};
new FrontEndStack(app, stackName, stackProps);
