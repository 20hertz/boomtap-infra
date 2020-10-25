#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { PlaygroundInfraStack } from "../lib/playground-infra-stack";

const app = new cdk.App();
new PlaygroundInfraStack(app, "PlaygroundInfraStack", {
  env: {
    region: "ca-central-1",
  },
});
