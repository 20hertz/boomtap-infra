#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { GitHubStack } from "../lib/OIDC/github-stack";
import { FileStorageStack } from "../lib/storage";

const app = new cdk.App();

new GitHubStack(app, "GitHubOpenIDConnect", {
  deployRole: "GitHubDeployRole",
  repositoryConfig: [{ owner: "20hertz", repo: "boomtap-infra" }],
});

new FileStorageStack(app, "FileStorageStack");
