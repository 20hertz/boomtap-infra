#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { GitHubStack } from "../lib/trust/github-oidc-stack";
import { FileStorageStack } from "../lib/storage";
import { getContext } from "./config";

const app = new cdk.App();

const { environment } = getContext(app);

new GitHubStack(app, "GitHubOpenIDConnect", {
  deployRole: "GitHubDeployRole",
  repositoryConfig: [
    {
      owner: "20hertz",
      repo: "boomtap-infra",
      filter: `environment:${environment}`,
    },
  ],
});

new FileStorageStack(app, "FileStorageStack");
