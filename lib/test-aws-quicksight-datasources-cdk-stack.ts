import * as cdk from '@aws-cdk/core';
import * as kms from '@aws-cdk/aws-kms'
import * as s3 from '@aws-cdk/aws-s3'
import * as s3Deploy from '@aws-cdk/aws-s3-deployment'
import * as fs from 'fs';

export class TestAwsQuicksightDatasourcesCdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const kmsKey = new kms.Key(this, 'MyKey', {
      enableKeyRotation: true,
      pendingWindow: cdk.Duration.days(7),
    });
    kmsKey.addAlias('alias/test-aws-quicksight-datasources-cdk');

    const bucketNameDataSource = 'jaykay-s3-quicksight-datasource-bucket'

    const bucketDataSource = new s3.Bucket(this, 's3-datasource-bucket', {
      bucketName: bucketNameDataSource,
      encryptionKey: kmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    })

    const fileNameManifest = 'manifest.json';
    const fileNameExampleData = 'exampleData.csv';


    const manifestBody = {
      fileLocations: [
        {
          URIs: [
            `s3://${bucketNameDataSource}/${fileNameExampleData}`
          ]
        }
      ],
      globalUploadSettings: {
        format: 'CSV',
        delimiter: ',',
        containsHeader: 'true'
      }
    }
    fs.writeFileSync('./lib/s3Files/manifest.json', JSON.stringify(manifestBody, null, 4), 'utf8');

    new s3Deploy.BucketDeployment(this, 's3-example-data', {
      sources: [s3Deploy.Source.asset('./lib/s3Files')],
      destinationBucket: bucketDataSource,
    });

  }
}
