import * as cdk from "@aws-cdk/core";
import * as cloudfront from "@aws-cdk/aws-cloudfront";
import * as s3 from "@aws-cdk/aws-s3";
import { SPADeploy } from "cdk-spa-deploy";
import path = require("path");
import { RemovalPolicy } from "@aws-cdk/core";
import { CachePolicy } from "@aws-cdk/aws-cloudfront";

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

    const { distribution, websiteBucket } = new SPADeploy(
      this,
      "cfDeploy"
    ).createSiteFromHostedZone({
      errorDoc: customProps?.wafAclArn ? undefined : "index.html",
      indexDoc: "index.html",
      subdomain: customProps?.subdomain ? customProps.subdomain : undefined,
      websiteFolder: path.join(__dirname, "..", "placeholder"),
      zoneName: "boomtap.io",
    });

    websiteBucket.applyRemovalPolicy(RemovalPolicy.DESTROY);

    const cfnDistro = distribution.node
      .defaultChild as cloudfront.CfnDistribution;

    // cfnDistro.addPropertyOverride(
    //   "DefaultCacheBehavior.CachePolicyId",
    //   CachePolicy.CACHING_OPTIMIZED
    // );

    if (customProps?.wafAclArn) {
      cfnDistro.addPropertyOverride(
        "DistributionConfig.WebACLId",
        customProps.wafAclArn
      );
    }

    this.exportValue(websiteBucket.bucketName);
  }
}
