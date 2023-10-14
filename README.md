# Boomtap Infra

## Prerequisites

You need:

- Node.js
- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- [AWS CDK Toolkit](https://docs.aws.amazon.com/cdk/v2/guide/cli.html)
- Proper AWS credentials

## Get a new environment up and running

There are a few steps to get there:

1. **Create an AWS account that is member of the organization**

   Easiest way is using CLI's [create-account](https://docs.aws.amazon.com/cli/latest/reference/organizations/create-account.html) command

   ```
   % aws organizations create-account --email <value> --account-name <ENVIRONMENT_NAME>
   ```

   Recommended: save the account id in a variable as you'll need it in the steps below.

2. **Define a profile that can assume the OrganizationAccountAccessRole**

   ```
   # ~/.aws/config

   [profile <NAME_OF_PROFILE>]
   role_arn = arn:aws:iam::<ACCOUNT_ID>:role/OrganizationAccountAccessRole
   source_profile = default (or any profile whose credentials have the OrganizationAccountAccessRole)
   region = <REGION>
   ```

3. **Create a policy that allows CDK to deploy resources on this account**

   ```
   aws iam create-policy \
   --policy-name CDKExecutionAccess \
   --policy-document file://cdkExecutionPolicy.json
   [--profile <PROFILE_NAME>]
   ```

   then

   ```
   cdk bootstrap /
      -c env=<ENVIRONMENT_NAME> /
      --cloudformation-execution-policies "arn:aws:iam::$ACCOUNT_ID:policy/CDKExecutionAccess /
      [--profile <PROFILE_NAME>]"
   ```

### Updating the CDK execution policy

You might need to expand the permission that CDK currently has to deploy resources. To do so, update the
CDKExecutionAccess policy with the new Actions you need and with respect to the least privilege principle.

1. Update cdkExecutionPolicy.json
2. Run

   ```
   ACCOUNT_ID=$(aws sts get-caller-identity --query "Account" --output text --profile backstage)
   ```

   ```
   aws iam create-policy-version \
       --policy-arn arn:aws:iam::$ACCOUNT_ID:policy/CDKExecutionAccess \
       --policy-document file://cdkExecutionPolicy.json \
       --profile backstage \
       --set-as-default
   ```

   then again

   ```
   cdk bootstrap \
        --cloudformation-execution-policies "arn:aws:iam::$ACCOUNT_ID:policy/CDKExecutionAccess [--profile backstage]"
   ```

   There is a limit to 5 Policy versions, so we need to delete old versions to make updates. But it’s not difficult. We simply list existing versions:

   ```
   aws iam list-policy-versions \
        --policy-arn arn:aws:iam::$ACCOUNT_ID:policy/CDKExecutionAccess
   ```

   And then delete the selected old version:

   ```
   aws iam delete-policy-version \
       --policy-arn arn:aws:iam::$ACCOUNT_ID:policy/CDKExecutionAccess \
       --version-id <VERSION>
   ```

## Other useful commands

- `pnpm build` --> compile typescript to js
- `pnpm watch` --> watch for changes and compile
- `pnpm test` --> perform the jest unit tests
- `cdk diff` --> compare deployed stack with current state
- `cdk synth` --> emits the synthesized CloudFormation template

## Misc

The `cdk.json` file tells the CDK Toolkit how to execute your app.
