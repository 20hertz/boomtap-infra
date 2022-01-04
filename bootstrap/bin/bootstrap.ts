#!/usr/bin/env node
import { App, DefaultStackSynthesizer } from "aws-cdk-lib";
import { OIDCStack } from "../lib/openID-stack";

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

const config = getConfig();

new OIDCStack(app, "OpenIDConnectStack", config, {
  env: {
    region: "ca-central-1",
  },
  synthesizer: new DefaultStackSynthesizer({
    // Specified at the bootstrap time. Checkout package.json "bootstrap" script.
    qualifier: "oidc",
  }),
});
