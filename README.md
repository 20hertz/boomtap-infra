# Boomtap Infra

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Get a new environment up and running

### CDK Execution access

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

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `cdk deploy` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk synth` emits the synthesized CloudFormation template
