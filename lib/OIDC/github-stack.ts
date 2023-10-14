import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

const githubDomain = "token.actions.githubusercontent.com";

export interface GitHubStackProps extends cdk.StackProps {
  /**
   * Name of the deploy role to assume in GitHub Actions.
   */
  readonly deployRole: string;
  /**
   * The sub prefix string from the JWT token used to be validated by AWS. Appended after `repo:${owner}/${repo}:`
   * in an IAM role trust relationship. The default value '*' indicates all branches and all tags from this repo.
   *
   * Example:
   * repo:octo-org/octo-repo:ref:refs/heads/demo-branch - only allowed from `demo-branch`
   * repo:octo-org/octo-repo:ref:refs/tags/demo-tag - only allowed from `demo-tag`.
   * repo:octo-org/octo-repo:pull_request - only allowed from the `pull_request` event.
   * repo:octo-org/octo-repo:environment:Production - only allowd from `Production` environment name.
   *
   * @default '*'
   * @see https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect#configuring-the-oidc-trust-with-the-cloud
   */
  readonly repositoryConfig: { owner: string; repo: string; filter?: string }[];
}

export class GitHubStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: GitHubStackProps) {
    super(scope, id, props);

    /**
     * Create an Identity provider for GitHub inside your AWS Account. This
     * allows GitHub to present itself to AWS IAM and assume a role.
     */
    const githubProvider = new iam.OpenIdConnectProvider(
      this,
      "GitHubOIDCProvider",
      {
        url: `https://${githubDomain}`,
        clientIds: ["sts.amazonaws.com"],
      }
    );

    const iamRepoDeployAccess = props.repositoryConfig.map(
      (r) => `repo:${r.owner}/${r.repo}:${r.filter ?? "*"}`
    );

    // grant only requests coming from a specific GitHub repository.
    const conditions: iam.Conditions = {
      StringLike: {
        [`${githubDomain}:sub`]: iamRepoDeployAccess,
      },
    };

    /**
     * Create a deployment role that has short lived credentials. The only
     * principal that can assume this role is the GitHub Open ID provider.
     *
     * This role is granted authority to assume aws cdk roles; which are created
     * by the aws cdk v2.
     */
    new iam.Role(this, "BoomtapGitHubDeployRole", {
      assumedBy: new iam.WebIdentityPrincipal(
        githubProvider.openIdConnectProviderArn,
        conditions
      ),
      managedPolicies: [
        iam.ManagedPolicy.fromManagedPolicyName(
          this,
          "ManagedPolicyName",
          "CDKExecutionAccess"
        ),
      ],
      roleName: props.deployRole,
      description:
        "This role is used via GitHub Actions to deploy with AWS CDK or Terraform on the target AWS account",
      maxSessionDuration: cdk.Duration.hours(1),
    });
  }
}
