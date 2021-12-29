#!/usr/bin/env node
import { App, DefaultStackSynthesizer, Stack, StackProps } from "aws-cdk-lib";
import { WebsiteStackConstruct } from "../lib/infrastructure-stack";

interface Config {
  readonly AccountID: string;
}

class WebsiteStack extends Stack {
  constructor(parent: App, name: string, props: StackProps) {
    super(parent, name, props);

    new WebsiteStackConstruct(this, "LandingPageStack");
  }
}

const app = new App();

const getConfig = (): Config => {
  const env = app.node.tryGetContext("config");

  if (!env)
    throw new Error(
      "Context variable missing on CDK command. Pass in as `-c config=XXX`"
    );

  return {
    AccountID: app.node.tryGetContext(env)["AccountID"],
  };
};

const config = getConfig();

new WebsiteStack(app, "WebsiteStack", {
  env: {
    region: "ca-central-1",
    account: config.AccountID,
  },
  synthesizer: new DefaultStackSynthesizer({
    // Specified at the bootstrap time. Checkout package.json "bootstrap" script.
    qualifier: "infra",
  }),
});
