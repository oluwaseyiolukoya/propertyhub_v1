import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Environment variable schema
const envSchema = z.object({
  // Service
  PORT: z.string().default('5001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Redis
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),

  // Dojah API
  DOJAH_API_KEY: z.string().min(1, 'DOJAH_API_KEY is required'),
  DOJAH_APP_ID: z.string().min(1, 'DOJAH_APP_ID is required'),
  DOJAH_WEBHOOK_SECRET: z.string().optional(),
  DOJAH_BASE_URL: z.string().default('https://api.dojah.io'),

  // DigitalOcean Spaces (S3-compatible)
  SPACES_ACCESS_KEY_ID: z.string().min(1, 'SPACES_ACCESS_KEY_ID is required'),
  SPACES_SECRET_ACCESS_KEY: z.string().min(1, 'SPACES_SECRET_ACCESS_KEY is required'),
  SPACES_REGION: z.string().default('nyc3'), // DigitalOcean regions: nyc3, sfo3, sgp1, fra1, ams3
  SPACES_BUCKET: z.string().min(1, 'SPACES_BUCKET is required'),
  SPACES_ENDPOINT: z.string().optional(), // e.g., https://nyc3.digitaloceanspaces.com

  // API Security
  API_KEY_MAIN_DASHBOARD: z.string().min(32, 'API_KEY_MAIN_DASHBOARD must be at least 32 characters'),
  ENCRYPTION_KEY: z.string().length(64, 'ENCRYPTION_KEY must be 64 hex characters (32 bytes)'),

  // CORS
  ALLOWED_ORIGINS: z.string().default('http://localhost:5173,http://localhost:5000'),

  // Main Dashboard
  MAIN_DASHBOARD_URL: z.string().default('http://localhost:5000'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('60000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100'),
});

// Parse and validate environment variables
const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment variable validation failed:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
};

const env = parseEnv();

// Export typed configuration
export const config = {
  port: parseInt(env.PORT, 10),
  nodeEnv: env.NODE_ENV,
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',

  database: {
    url: env.DATABASE_URL,
  },

  redis: {
    url: env.REDIS_URL,
  },

  dojah: {
    apiKey: env.DOJAH_API_KEY,
    appId: env.DOJAH_APP_ID,
    webhookSecret: env.DOJAH_WEBHOOK_SECRET,
    baseUrl: env.DOJAH_BASE_URL,
  },

  spaces: {
    accessKeyId: env.SPACES_ACCESS_KEY_ID,
    secretAccessKey: env.SPACES_SECRET_ACCESS_KEY,
    region: env.SPACES_REGION,
    bucket: env.SPACES_BUCKET,
    endpoint: env.SPACES_ENDPOINT || `https://${env.SPACES_REGION}.digitaloceanspaces.com`,
  },

  security: {
    apiKeyMainDashboard: env.API_KEY_MAIN_DASHBOARD,
    encryptionKey: Buffer.from(env.ENCRYPTION_KEY, 'hex'),
  },

  cors: {
    allowedOrigins: env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()),
  },

  mainDashboard: {
    url: env.MAIN_DASHBOARD_URL,
  },

  rateLimit: {
    windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS, 10),
    maxRequests: parseInt(env.RATE_LIMIT_MAX_REQUESTS, 10),
  },
};

// Log configuration on startup (without sensitive data)
if (config.isDevelopment) {
  console.log('📋 Configuration loaded:');
  console.log(`  - Port: ${config.port}`);
  console.log(`  - Environment: ${config.nodeEnv}`);
  console.log(`  - Database: ${config.database.url.split('@')[1] || 'configured'}`);
  console.log(`  - Redis: ${config.redis.url.split('@')[1] || 'configured'}`);
  console.log(`  - Dojah Base URL: ${config.dojah.baseUrl}`);
  console.log(`  - Spaces Bucket: ${config.spaces.bucket}`);
  console.log(`  - Allowed Origins: ${config.cors.allowedOrigins.join(', ')}`);
}

