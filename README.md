## Prerequisites

You need:

- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- AWS CDK Toolkit (v2) --> `% npm install -g aws-cdk`
- Node.js

## Useful commands

- `yarn build` compile typescript to js
- `yarn watch` watch for changes and compile
- `yarn test` perform the jest unit tests
- `cdk deploy` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk synth` emits the synthesized CloudFormation template

## Gothas on deploying

- The `cdk.json` file tells the CDK Toolkit how to execute your app.
- The ACM certificate must be validated by DNS. So when deploying, keep an eye on [ACM](https://console.aws.amazon.com/acm/home?region=us-east-1) while refreshing the page at times. When the certificate request for the provided domain appears, select the button that prompts you to create a CNAME record for it in Route 53.

### References

- https://dev.to/aws-builders/deploying-aws-cdk-apps-using-short-lived-credentials-and-github-actions-59g6
- https://dev.to/simonireilly/secure-aws-cdk-deployments-with-github-actions-3jfk
