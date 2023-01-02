## Prerequisites

You need:

- AWS account and credentials
- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- AWS CDK Toolkit (v2) --> `npm install -g aws-cdk`
- Node.js

## Useful commands

- `yarn build` compile typescript to js
- `yarn watch` watch for changes and compile
- `yarn test` perform the jest unit tests
- `cdk deploy` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk synth` emits the synthesized CloudFormation template

## Spinning up a new environment

There are a few steps that needs to be done manually for this:

### 1. Create an AWS account that is member of the organization

Easiest way is using CLI's [create-account](https://docs.aws.amazon.com/cli/latest/reference/organizations/create-account.html) command

```
% aws organizations create-account --email <value> --account-name <ENVIRONMENT_NAME>
```

### 2. Create a policy to allow deployment through CDK

- In console, switch to the new account
- Create a policy named _DeploymentRights_ and copy over the JSON from other accounts

### 3. Create a Deployer role

- Create a role with a trusted entity type of _Another AWS account_
- Enter the ID of the main account
- Attach _DeploymentRights_ permissions
- Name role _DeployerRole_

### 4. Grant permissions to the Deployer user

- Switch back to the main account
- Create a policy:

  - Service: STS
  - Actions: AssumeRole
  - Resources: Specific, then choose Add ARN
    - Account ID: account ID of the new account
    - Role name with path: _DeployerRole_
  - In review step, name that policy _GrantAccessToBoomtapDeployerRole_

- Attach this policy to the IAM user responsible of deployment

### 5. Define role profile in CLI config

- In ~/.aws/config, add a profile
  as such:

```
[profile <NAME_OF_PROFILE>]
role_arn = arn:aws:iam::<NEW_ACCOUNT_ID>:role/DeployerRole
source_profile = default (or any profile whose credentials have the DeployerRole)
region = <REGION>
```

### 6. Delegate domains across AWS accounts

- Go into Route 53 console in the new account.
- Create a hosted zone
  - For _Domain Name_, enter: <subdomain (if any)>.<domain_apex>
  - Click create
- Click on the row with NS type. And copy the 4 lines in the _Value_ field
- Switch to the Production account.
- Select the domain apex
- Create a record set, and fill in:
  - Name: <subdomain>
  - Type: NS - Name server
  - And paste the 4 lines from above in the _Value_ field.
- Click Create

Now we’ve delegated the <subdomain> of <domain_apex> to our new AWS account

### 7. Go to Bootstrap stack

- bootstrap the stack with `--profile <PROFILE_CREATED_ABOVE>`
- deploy the stack
- Set the ARN for the CDKDeployerRole as a repository-level secret

```
gh secret set STAGING_DEPLOYER_ROLE_ARN
```

- Do the same about WebsiteDeployerRole in the repos depending upon it

### 8. Go to Infrastructure stack

- bootstrap the stack
- deploy the CertifiedDomainsStack
- In console, head over to the new Hosted Zone
- Copy the value for the NS record
- Head over to the account (Prod) that owns the domain apex
- update the matching record with the copied NS values
- deploy everything else

### Other parts of the infra that aren't covered by these IaC models

- Creating and verifying identities in Amazon SES (email)
  - Just follow [this guide](https://docs.aws.amazon.com/ses/latest/dg/creating-identities.html) for now.
- You need the OrganizationAccountAccessRole to access the environment accounts. See https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_accounts_access.html

### Switching accounts

Role: OrganizationAccountAccessRole

## References

- https://dev.to/aws-builders/deploying-aws-cdk-apps-using-short-lived-credentials-and-github-actions-59g6
- https://dev.to/simonireilly/secure-aws-cdk-deployments-with-github-actions-3jfk
- https://www.jerrychang.ca/writing/security-harden-github-actions-deployments-to-aws-with-oidc
