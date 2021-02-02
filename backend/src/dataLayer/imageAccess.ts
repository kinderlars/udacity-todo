import * as AWSXRay from "aws-xray-sdk";
import * as AWS from "aws-sdk";

const XAWS = AWSXRay.captureAWS(AWS)

export class ImageAccess {

  constructor(
      private readonly bucketName: string = process.env.IMAGES_S3_BUCKET,
      private readonly urlExpiration: string = process.env.SIGNED_URL_EXPIRATION,
      private readonly s3 = new XAWS.S3({signatureVersion: "v4"})
  ){}

  async getUploadUrl(imageId: string): Promise<string> {
    const presignedurl = await this.s3.getSignedUrl('putObject', {
      Bucket: this.bucketName,
      Key: imageId,
      Expires: parseInt(this.urlExpiration)
    })
    return presignedurl
  }
}