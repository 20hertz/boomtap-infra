import { aws_iam, CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";

export class InfraStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const gitHubOIDCProvider = new aws_iam.OpenIdConnectProvider(
      this,
      "gitHubOIDCProvider",
      {
        url: "https://token.actions.githubusercontent.com",
        clientIds: ["sts.amazonaws.com"],
      }
    );

    /**
     * Amend those to your needs.
     */
    const gitHubUsername = " 20hertz";
    const gitHubRepoName = "boomtap-infra";
    const gitHubBranchName = "main";

    const applicationDeployerRole = new aws_iam.Role(
      this,
      "applicationDeployerRole",
      {
        assumedBy: new aws_iam.WebIdentityPrincipal(
          gitHubOIDCProvider.openIdConnectProviderArn,
          {
            StringLike: {
              "token.actions.githubusercontent.com:sub": `repo:${gitHubUsername}/${gitHubRepoName}:ref:refs/heads/${gitHubBranchName}`,
            },
          }
        ),
        inlinePolicies: {
          allowAssumeOnAccountB: new aws_iam.PolicyDocument({
            statements: [
              new aws_iam.PolicyStatement({
                effect: aws_iam.Effect.ALLOW,
                actions: ["sts:AssumeRole"],
                resources: ["arn:aws:iam::925901147548:role/*"],
              }),
            ],
          }),
        },
      }
    );

    new CfnOutput(this, "applicationDeployerRoleArn", {
      value: applicationDeployerRole.roleArn,
    });
  }
}
