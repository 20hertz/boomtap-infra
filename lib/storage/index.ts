import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { getContext } from "../../bin/config";

export class FileStorageStack extends cdk.Stack {
  constructor(parent: cdk.App, id: string, props?: cdk.StackProps) {
    super(parent, id, props);

    const { origins } = getContext(parent);

    const user = new iam.User(this, "IamUser", {
      userName: "Webapp",
    });

    user.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonS3FullAccess")
    );

    const bucket = new s3.Bucket(this, "SoundKitSourceFilesBucket", {
      bucketName: "sound-kit-sources",
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    const corsRule: s3.CorsRule = {
      allowedMethods: [s3.HttpMethods.GET],
      allowedOrigins: origins,
      allowedHeaders: ["*"],
    };

    bucket.grantPut(new iam.ArnPrincipal(user.userArn));

    bucket.addCorsRule(corsRule);

    bucket.node.addDependency(user);

    new cdk.CfnOutput(this, "IamUsername", {
      value: user.userName,
      description: `Now create an access key for this user by running 'aws iam create-access-key --user-name <username>'. The returned ACCESS_KEY_ID and SECRET_ACCESS_KEY goes with the rest of the app's environment variables.'`,
    });
  }
}
