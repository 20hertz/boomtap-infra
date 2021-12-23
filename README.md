## Prerequisites

You need:

- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- AWS CDK Toolkit (v2) --> `% npm install -g aws-cdk`
- Node.js

## Gothas on deploying

The ACM certificate must be validated by DNS. So when deploying, keep an eye on [ACM](https://console.aws.amazon.com/acm/home?region=us-east-1) while refreshing the page at times. When the certificate request for the provided domain appears, select the button that prompts you to create a CNAME record for it in Route 53.
