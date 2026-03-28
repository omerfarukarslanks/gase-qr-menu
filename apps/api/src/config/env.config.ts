export default () => ({
  // Application
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],

  // Database
  databaseUrl: process.env.DATABASE_URL,

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'change-me-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'change-me-refresh',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // S3 / MinIO
  s3: {
    endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
    accessKey: process.env.S3_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.S3_SECRET_KEY || 'minioadmin',
    bucket: process.env.S3_BUCKET || 'gase-uploads',
    region: process.env.S3_REGION || 'us-east-1',
    publicUrl: process.env.S3_PUBLIC_URL || 'http://localhost:9000/gase-uploads',
    publicRead: process.env.S3_PUBLIC_READ !== 'false',
  },

  // Iyzico Payment
  iyzico: {
    apiKey: process.env.IYZICO_API_KEY || '',
    secretKey: process.env.IYZICO_SECRET_KEY || '',
    baseUrl: process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com',
  },
});
