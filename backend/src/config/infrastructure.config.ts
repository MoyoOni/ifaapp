import { registerAs } from '@nestjs/config';

export default registerAs('infrastructure', () => ({
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  opensearch: {
    host: process.env.OPENSEARCH_HOST || 'localhost',
    port: parseInt(process.env.OPENSEARCH_PORT || '9200', 10),
    username: process.env.OPENSEARCH_USERNAME || 'admin',
    password: process.env.OPENSEARCH_PASSWORD || 'admin',
  },
  aws: {
    s3: {
      bucketName: process.env.AWS_S3_BUCKET_NAME,
    },
    cloudfront: {
      distributionId: process.env.AWS_CLOUDFRONT_DISTRIBUTION_ID,
    },
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1',
  },
  queues: {
    concurrency: {
      notifications: parseInt(process.env.NOTIFICATION_QUEUE_CONCURRENCY || '5', 10),
      imageProcessing: parseInt(process.env.IMAGE_PROCESSING_QUEUE_CONCURRENCY || '3', 10),
      opensearchSync: parseInt(process.env.OPENSEARCH_SYNC_CONCURRENCY || '2', 10),
    },
  },
}));