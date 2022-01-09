#!/usr/bin/env node
import { App } from "aws-cdk-lib";
import { OIDCProviderStack } from "../lib/openID-stack";

interface Config {
  readonly gitHubBranchName: string;
}

const app = new App();

const getConfig = (): Config => {
  const env = app.node.tryGetContext("config");

  if (!env)
    throw new Error(
      "Context variable missing on CDK command. Pass in as `-c config=XXX`"
    );

  return {
    gitHubBranchName: app.node.tryGetContext(env)["GitHubBranchName"],
  };
};

// const config = getConfig();

new OIDCProviderStack(app, "OIDCProviderStack", {
  ...getConfig(),
  env: {
    region: "us-east-2",
  },
});
