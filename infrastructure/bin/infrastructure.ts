#!/usr/bin/env node
import { App, DefaultStackSynthesizer, Stack, StackProps } from "aws-cdk-lib";
import { WebsiteStackConstruct } from "../lib/infrastructure-stack";

class WebsiteStack extends Stack {
  constructor(parent: App, name: string, props: StackProps) {
    super(parent, name, props);

    new WebsiteStackConstruct(this, "LandingPageStack");
  }
}

const app = new App();

new WebsiteStack(app, "WebsiteStack", {
  env: { region: "ca-central-1", account: "925901147548" },
  synthesizer: new DefaultStackSynthesizer({
    // Specified at the bootstrap time. Checkout package.json "bootstrap" script.
    qualifier: "infra",
  }),
});
