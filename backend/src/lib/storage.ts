import { S3Client } from '@aws-sdk/client-s3';
import multer from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';
import fs from 'fs';

// Check if we should use S3/Spaces storage
const useCloudStorage = process.env.USE_CLOUD_STORAGE === 'true' || process.env.NODE_ENV === 'production';

// DigitalOcean Spaces configuration (S3-compatible)
const spacesEndpoint = process.env.SPACES_ENDPOINT || 'https://nyc3.digitaloceanspaces.com';
const spacesRegion = process.env.SPACES_REGION || 'nyc3';
const spacesAccessKey = process.env.SPACES_ACCESS_KEY_ID;
const spaceSecretKey = process.env.SPACES_SECRET_ACCESS_KEY;
const spacesBucket = process.env.SPACES_BUCKET || 'contrezz-uploads';

// Initialize S3 client for DigitalOcean Spaces
let s3Client: S3Client | null = null;

if (useCloudStorage && spacesAccessKey && spaceSecretKey) {
  s3Client = new S3Client({
    endpoint: spacesEndpoint,
    region: spacesRegion,
    credentials: {
      accessKeyId: spacesAccessKey,
      secretAccessKey: spaceSecretKey,
    },
    forcePathStyle: false, // DigitalOcean Spaces uses virtual-hosted-style URLs
  });
  console.log('✅ Cloud storage (DigitalOcean Spaces) initialized');
} else if (useCloudStorage) {
  console.warn('⚠️  Cloud storage enabled but credentials missing. Falling back to local storage.');
}

/**
 * Create multer storage for logos
 */
export const createLogoStorage = () => {
  if (s3Client) {
    // Use DigitalOcean Spaces
    return multerS3({
      s3: s3Client,
      bucket: spacesBucket,
      acl: 'public-read',
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}`;
        const ext = path.extname(file.originalname);
        cb(null, `logos/platform-logo-${uniqueSuffix}${ext}`);
      },
    });
  }

  // Fallback to local storage (development)
  const uploadsDir = path.resolve(__dirname, '../../uploads');
  const logosDir = path.resolve(uploadsDir, 'logos');
  
  // Ensure directory exists
  try {
    fs.mkdirSync(logosDir, { recursive: true });
  } catch (error) {
    console.error('Failed to create logos directory:', error);
  }

  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, logosDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}`;
      const ext = path.extname(file.originalname);
      cb(null, `platform-logo-${uniqueSuffix}${ext}`);
    },
  });
};

/**
 * Create multer storage for favicons
 */
export const createFaviconStorage = () => {
  if (s3Client) {
    // Use DigitalOcean Spaces
    return multerS3({
      s3: s3Client,
      bucket: spacesBucket,
      acl: 'public-read',
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}`;
        const ext = path.extname(file.originalname);
        cb(null, `favicons/platform-favicon-${uniqueSuffix}${ext}`);
      },
    });
  }

  // Fallback to local storage (development)
  const uploadsDir = path.resolve(__dirname, '../../uploads');
  const faviconsDir = path.resolve(uploadsDir, 'favicons');
  
  // Ensure directory exists
  try {
    fs.mkdirSync(faviconsDir, { recursive: true });
  } catch (error) {
    console.error('Failed to create favicons directory:', error);
  }

  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, faviconsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}`;
      const ext = path.extname(file.originalname);
      cb(null, `platform-favicon-${uniqueSuffix}${ext}`);
    },
  });
};

/**
 * Get the public URL for an uploaded file
 */
export const getPublicUrl = (filePath: string): string => {
  if (s3Client && useCloudStorage) {
    // Return Spaces CDN URL
    const spacesUrl = process.env.SPACES_CDN_ENDPOINT || `https://${spacesBucket}.${spacesRegion}.cdn.digitaloceanspaces.com`;
    // Remove leading slash if present
    const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    return `${spacesUrl}/${cleanPath}`;
  }
  
  // Return local URL (for development)
  return filePath;
};

/**
 * Delete a file from storage
 */
export const deleteFile = async (filePath: string): Promise<void> => {
  if (s3Client && useCloudStorage) {
    // Delete from Spaces
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    // Remove leading slash and any URL prefix
    const key = filePath.replace(/^\//, '').replace(/^https?:\/\/[^/]+\//, '');
    
    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: spacesBucket,
          Key: key,
        })
      );
      console.log(`✅ Deleted file from Spaces: ${key}`);
    } catch (error) {
      console.error(`Failed to delete file from Spaces: ${key}`, error);
      throw error;
    }
  } else {
    // Delete from local filesystem
    const uploadsDir = path.resolve(__dirname, '../../uploads');
    const fullPath = path.join(uploadsDir, filePath.replace(/^\/uploads\//, ''));
    
    try {
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        console.log(`✅ Deleted local file: ${fullPath}`);
      }
    } catch (error) {
      console.error(`Failed to delete local file: ${fullPath}`, error);
      throw error;
    }
  }
};

export { s3Client, useCloudStorage };

