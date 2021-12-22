import { aws_iam, CfnOutput, Stack, StackProps, Duration } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  OpenIdConnectPrincipal,
  Role,
  PolicyDocument,
  PolicyStatement,
  Effect,
} from "aws-cdk-lib/aws-iam";

export class InfraStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    /**
     * Create an Identity provider for GitHub inside your AWS Account. This
     * allows GitHub to present itself to AWS IAM and assume a role.
     */
    const gitHubOIDCProvider = new aws_iam.OpenIdConnectProvider(
      this,
      "GitHubOIDCProvider",
      {
        url: "https://token.actions.githubusercontent.com",
        clientIds: ["sts.amazonaws.com"],
      }
    );

    const githubUsername = "20hertz";
    const gitHubRepoName = "boomtap-infra";
    /**
     * Create a principal for the OpenID; which can allow it to assume
     * deployment roles.
     */
    const gitHubPrincipal = new OpenIdConnectPrincipal(
      gitHubOIDCProvider
    ).withConditions({
      StringLike: {
        "token.actions.githubusercontent.com:sub": `repo:${githubUsername}/${gitHubRepoName}:*`,
      },
    });

    /**
     * Create a deployment role that has short lived credentials. The only
     * principal that can assume this role is the GitHub Open ID provider.
     *
     * This role is granted authority to assume aws cdk roles; which are created
     * by the aws cdk v2.
     */
    new Role(this, "GitHubActionsRole", {
      assumedBy: gitHubPrincipal,
      description:
        "Role assumed by GitHubPrincipal for deploying from CI using aws cdk",
      roleName: "github-ci-role",
      maxSessionDuration: Duration.hours(1),
      inlinePolicies: {
        CdkDeploymentPolicy: new PolicyDocument({
          assignSids: true,
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: ["sts:AssumeRole"],
              resources: [`arn:aws:iam::925901147548:role/cdk-*`],
            }),
          ],
        }),
      },
    });
  }
}
