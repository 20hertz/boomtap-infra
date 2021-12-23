#!/usr/bin/env node
import { App, DefaultStackSynthesizer } from "aws-cdk-lib";
import { LandingPageStack } from "../lib/infrastructure-stack";

const app = new App();

new LandingPageStack(app, "LandingPageStack", {
  env: { region: "ca-central-1" },
  synthesizer: new DefaultStackSynthesizer({
    // Specified at the bootstrap time. Checkout package.json "bootstrap" script.
    qualifier: "infra",
  }),
});
