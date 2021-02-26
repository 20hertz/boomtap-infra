# Boomtap IaC

## Useful commands

 * `yarn build`      compile typescript to js
 * `yarn watch`      watch for changes and compile
 * `yarn test`       perform the jest unit tests
 * `cdk deploy '*'`  deploy all stacks to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template
 * `cdk destroy`     clean everything, except S3 bucket

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Things to do in AWS console after deploying a stack
Update A record route
  - Go to route53
  - Edit boomtap.io A type record
  - Under Value/Route traffic to, update the cloudfront domain name