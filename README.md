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

There are still a few steps that needs to be done manually:

### 1. Create an AWS account that is member of the organization

Easiest way is using CLI's [create-account](https://docs.aws.amazon.com/cli/latest/reference/organizations/create-account.html) command

```
% aws create-account --email <value> --account-name <value>
```

### 2. Create an IAM user

- In the console, switch to the new account
- Create an IAM user with programmatic access only
- Give this user the Deployer permissions (see examples in existing accounts)

### 3. Delegate domains across AWS accounts

- Go into Route 53 console in the new account.
- Create a hosted zone
  - For _Domain Name_, enter: <subdomain (if any)>.<domain_apex>
  - Click create
- Click on the row with NS type. And copy the 4 lines in the _Value_ field
- Switch to the main account, where the domain is hosted. And go into Route 53 console.
- Select the domain
- Create a record set, and fill in:
  - Name: <subdomain>
  - Type: NS - Name server
  - And paste the 4 lines from above in the _Value_ field.
- Click Create

Now we’ve delegated the <subdomain> of <domain_apex> to our new AWS account

### 4. Go to Deploy Bootstrap stack

- bootstrap the stack with the --profile <PROFILE_OF_USER_CREATED_ABOVE>
- deploy the stack
- Copy the ARN for the applicationDeployerRole

### 5. Go to Infrastructure stack

- paste the ARN next to _role-to-assume_ in the github workflow
- bootstrap the stack

## References

- https://dev.to/aws-builders/deploying-aws-cdk-apps-using-short-lived-credentials-and-github-actions-59g6
- https://dev.to/simonireilly/secure-aws-cdk-deployments-with-github-actions-3jfk
