import * as cdk from "@aws-cdk/core";
import * as cloudfront from "@aws-cdk/aws-cloudfront";
import { SPADeploy } from "cdk-spa-deploy";
import path = require("path");

interface CustomProps {
  subdomain?: string;
  wafAclArn?: string;
}

export class FrontEndStack extends cdk.Stack {
  constructor(
    scope: cdk.Construct,
    id?: string,
    props?: cdk.StackProps,
    customProps?: CustomProps
  ) {
    super(scope, id, props);

    const { distribution } = new SPADeploy(
      this,
      "cfDeploy"
    ).createSiteFromHostedZone({
      errorDoc: customProps?.wafAclArn ? undefined : "index.html",
      indexDoc: "index.html",
      subdomain: customProps?.subdomain ? customProps.subdomain : undefined,
      websiteFolder: path.join(__dirname, "..", "placeholder"),
      zoneName: "boomtap.io",
    });

    if (customProps?.wafAclArn) {
      const cfnDistro = distribution.node
        .defaultChild as cloudfront.CfnDistribution;
      cfnDistro.addPropertyOverride(
        "DistributionConfig.WebACLId",
        customProps.wafAclArn
      );
    }
  }
}
