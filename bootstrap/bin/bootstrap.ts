#!/usr/bin/env node
import { App, DefaultStackSynthesizer } from "aws-cdk-lib";
import { BootstrapStack } from "../lib/bootstrap-stack";

const app = new App();
new BootstrapStack(app, "BootstrapStack", {
  env: {
    region: "ca-central-1",
  },
  synthesizer: new DefaultStackSynthesizer({
    // Specified at the bootstrap time. Checkout package.json "bootstrap" script.
    qualifier: "bootstrap",
  }),
});
