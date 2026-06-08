import * as cdk from "aws-cdk-lib";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as s3 from "aws-cdk-lib/aws-s3";
import type { Construct } from "constructs";
import { join } from "node:path";

/**
 * 技術ブログプラットフォーム
 */
export class BlogStack extends cdk.Stack {
  /** テーブル */
  public readonly table: dynamodb.TableV2;
  /** ユーザープール */
  public readonly userPool: cognito.UserPool;
  /** ユーザープールクライアント */
  public readonly userPoolClient: cognito.UserPoolClient;

  /**
   * コンストラクター
   * @param scope
   * @param id
   * @param props
   */
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDBに作成するブログ用のテーブル
    this.table = new dynamodb.TableV2(this, "BlogTable", {
      partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "sk", type: dynamodb.AttributeType.STRING },
      billing: dynamodb.Billing.onDemand(),
      globalSecondaryIndexes: [
        {
          indexName: "byCreatedAt",
          partitionKey: { name: "gsi1pk", type: dynamodb.AttributeType.STRING },
          sortKey: { name: "gsi1sk", type: dynamodb.AttributeType.STRING },
          // Projection defaults to ALL
        },
      ],
    });

    // ユーザープール
    this.userPool = new cognito.UserPool(this, "BlogUserPool", {
      signInAliases: { email: true },
      selfSignUpEnabled: true,
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // for development
    });

    // ユーザープールクライアント
    this.userPoolClient = new cognito.UserPoolClient(
      this,
      "BlogUserPoolClient",
      {
        userPool: this.userPool,
        authFlows: {
          userPassword: true,
          userSrp: true,
        },
        generateSecret: false,
      },
    );

    // --- SPA Hosting: S3 + CloudFront (OAC) ---
    const spaBucket = new s3.Bucket(this, "SpaBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const distribution = new cloudfront.Distribution(this, "SpaDistribution", {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(spaBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: "index.html",
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
        },
      ],
    });

    // --- Lambda API Function ---
    const fn = new lambdaNodejs.NodejsFunction(this, "BlogApiFunction", {
      runtime: lambda.Runtime.NODEJS_24_X,
      entry: join(__dirname, "../../backend/src/index.ts"),
      handler: "handler",
      environment: {
        TABLE_NAME: this.table.tableName,
        COGNITO_USER_POOL_ID: this.userPool.userPoolId,
        COGNITO_CLIENT_ID: this.userPoolClient.userPoolClientId,
      },
      bundling: {
        externalModules: [],
        minify: true,
        forceDockerBundling: false,
      },
    });

    // Grant minimal IAM permissions: read/write to DynamoDB table
    this.table.grantReadWriteData(fn);

    // Function URL (public, CORS configured)
    const fnUrl = fn.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: {
        allowedOrigins: ["*"], // Will be restricted to CloudFront URL in production
        allowedMethods: [
          lambda.HttpMethod.GET,
          lambda.HttpMethod.POST,
          lambda.HttpMethod.OPTIONS,
        ],
        allowedHeaders: ["Content-Type", "Authorization"],
        allowCredentials: false,
      },
    });

    // ======================================================================================
    // CDKの成果物
    // ======================================================================================

    new cdk.CfnOutput(this, "UserPoolId", { value: this.userPool.userPoolId });

    new cdk.CfnOutput(this, "UserPoolClientId", {
      value: this.userPoolClient.userPoolClientId,
    });

    new cdk.CfnOutput(this, "DistributionUrl", {
      value: `https://${distribution.distributionDomainName}`,
    });

    new cdk.CfnOutput(this, "ApiUrl", { value: fnUrl.url });
  }
}
