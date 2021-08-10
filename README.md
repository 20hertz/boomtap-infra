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

## Gothas on deploying
The ACM certificate must be validated by DNS.  So when deploying, keep an eye on [ACM](https://console.aws.amazon.com/acm/home?region=us-east-1) while refreshing the page at times.  When the certificate request for the provided domain appears, select the button that prompts you to create a CNAME record for it in Route 53.