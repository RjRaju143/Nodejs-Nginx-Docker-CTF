export const handler = async (event, context) => {
  // Extract the S3 bucket and key from the event
  const s3Event = event.Records[0].s3;
  const bucketName = s3Event.bucket.name;
  const objectKey = s3Event.object.key;

//  console.log(`S3 bucket: ${bucketName}`);  // bucket name
//  console.log(`Object key: ${objectKey}`); /// file name

  // Handle the S3 event based on its type
  switch (event.Records[0].eventName) {
    case "ObjectCreated:Put":
      console.log(`File added: s3://${bucketName}/${objectKey}`);
      // Handle new file creation
      break;
    case "ObjectRemoved:DeleteMarkerCreated":
      console.log(`File deleted: s3://${bucketName}/${objectKey}`);
      // Handle file deletion
      break;
    case "ObjectRemoved:Delete":
      console.log(`File deleted: s3://${bucketName}/${objectKey}`);
      //// Handle file deletion
      
    case "ObjectCreated:Copy":
      console.log(`File copied: s3://${bucketName}/${objectKey}`);
      // Handle file copy
      break;
    case "ObjectCreated:CompleteMultipartUpload":
      console.log(`File upload complete: s3://${bucketName}/${objectKey}`);
      // Handle multipart upload completion
      break;
    default:
      console.log(`Unknown S3 event: ${event.Records[0].eventName}`);
      break;
  }
};
