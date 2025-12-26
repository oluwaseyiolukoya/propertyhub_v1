import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import https from "https";

interface UploadFileOptions {
  file: {
    originalName: string;
    buffer: Buffer;
    mimetype: string;
    size: number;
  };
  applicationId?: string;
  category?: string;
  fileType?: "resume" | "coverLetter"; // Type of file being uploaded
}

class StorageService {
  private s3Client: S3Client;
  private bucketName: string;
  private endpoint: string;
  private cdnUrl: string | null;

  constructor() {
    // Initialize Digital Ocean Spaces client (S3-compatible)
    // Match the working implementation from verification.service.ts
    const region =
      process.env.DO_SPACES_REGION || process.env.SPACES_REGION || "nyc3";

    this.endpoint =
      process.env.DO_SPACES_ENDPOINT ||
      process.env.SPACES_ENDPOINT ||
      `https://${region}.digitaloceanspaces.com`;
    this.bucketName =
      process.env.DO_SPACES_BUCKET ||
      process.env.SPACES_BUCKET ||
      "contrezz-uploads";
    this.cdnUrl = process.env.DO_SPACES_CDN_URL || null;

    const accessKeyId =
      process.env.DO_SPACES_ACCESS_KEY_ID ||
      process.env.SPACES_ACCESS_KEY_ID ||
      "";
    const secretAccessKey =
      process.env.DO_SPACES_SECRET_ACCESS_KEY ||
      process.env.SPACES_SECRET_ACCESS_KEY ||
      "";

    if (!accessKeyId || !secretAccessKey) {
      console.warn(
        "⚠️  DigitalOcean Spaces credentials not configured. File uploads will fail."
      );
    }

    // Configure httpsAgent for SSL certificate handling (matches verification.service.ts)
    const httpsAgent = new https.Agent({
      rejectUnauthorized:
        process.env.NODE_ENV === "production" &&
        process.env.SKIP_SSL_VERIFICATION !== "true",
    });

    this.s3Client = new S3Client({
      region: region,
      endpoint: this.endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: false, // Digital Ocean Spaces uses virtual-hosted-style URLs
      requestHandler: {
        httpsAgent: httpsAgent,
      },
    });

    console.log(`✅ Public Storage Service initialized`);
    console.log(`   Endpoint: ${this.endpoint}`);
    console.log(`   Bucket: ${this.bucketName}`);
    console.log(`   CDN: ${this.cdnUrl || "Not configured"}`);
  }

  /**
   * Generate storage path for a file
   */
  private generateStoragePath(options: UploadFileOptions): string {
    const {
      file,
      applicationId,
      category = "careers",
      fileType = "resume",
    } = options;

    // Generate unique filename
    const ext = path.extname(file.originalName);
    const filename = `${uuidv4()}${ext}`;

    // Build path: careers/applications/{applicationId}/{fileType}-{uuid}.{ext}
    let storagePath = `${category}/applications`;

    if (applicationId) {
      storagePath += `/${applicationId}`;
    } else {
      // If no applicationId yet, use temp folder (will be moved later)
      storagePath += `/temp`;
    }

    storagePath += `/${fileType}-${filename}`;

    return storagePath;
  }

  /**
   * Upload file to DigitalOcean Spaces
   */
  async uploadFile(options: UploadFileOptions): Promise<{
    success: boolean;
    filePath: string;
    fileUrl: string;
    cdnUrl?: string;
    fileSize: number;
  }> {
    const { file } = options;

    // Generate storage path
    const storagePath = this.generateStoragePath(options);

    try {
      // Upload to Digital Ocean Spaces
      // Use absolute minimal configuration - only required parameters
      // DigitalOcean Spaces handles privacy at bucket level
      const contentType = file.mimetype || "application/octet-stream";

      const uploadCommand = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: storagePath,
        Body: file.buffer,
        ContentType: contentType,
        // Minimal configuration - no ACL, no encryption, no metadata
        // Privacy is handled at the bucket level in DigitalOcean Spaces
      });

      console.log(`📤 [Public Storage] Uploading file: ${storagePath}`);
      console.log(`📤 [Public Storage] Upload details:`, {
        bucket: this.bucketName,
        key: storagePath,
        contentType,
        fileSize: file.size,
        endpoint: this.endpoint,
        region:
          process.env.DO_SPACES_REGION || process.env.SPACES_REGION || "nyc3",
        hasBuffer: !!file.buffer,
        bufferLength: file.buffer?.length,
      });

      await this.s3Client.send(uploadCommand);
      console.log(
        `✅ [Public Storage] File uploaded successfully: ${storagePath}`
      );

      // Generate file URL (signed URL for private files)
      const fileUrl = await this.getFileUrl(storagePath);
      const cdnUrl = this.cdnUrl ? `${this.cdnUrl}/${storagePath}` : undefined;

      return {
        success: true,
        filePath: storagePath,
        fileUrl,
        cdnUrl,
        fileSize: file.size,
      };
    } catch (error: any) {
      console.error("❌ [Public Storage] Upload error:", error);
      console.error("❌ [Public Storage] Error details:", {
        code: error.Code,
        message: error.message,
        requestId: error.RequestId,
        httpStatusCode: error.$metadata?.httpStatusCode,
        bucket: this.bucketName,
        key: storagePath,
        contentType: file.mimetype,
        fileSize: file.size,
      });

      // Provide more helpful error messages
      if (error.Code === "InvalidAccessKeyId") {
        throw new Error(
          `Invalid DigitalOcean Spaces Access Key. Please check DO_SPACES_ACCESS_KEY_ID environment variable.`
        );
      }

      if (error.Code === "SignatureDoesNotMatch") {
        throw new Error(
          `Invalid DigitalOcean Spaces Secret Key. Please check DO_SPACES_SECRET_ACCESS_KEY environment variable.`
        );
      }

      if (error.Code === "InvalidArgument") {
        throw new Error(
          `Invalid upload parameters. Please check your DigitalOcean Spaces configuration. ${
            error.message || ""
          }`
        );
      }

      throw new Error(
        `Failed to upload file: ${error.message || "Unknown error"} (Code: ${
          error.Code || "Unknown"
        })`
      );
    }
  }

  /**
   * Get signed URL for private file (valid for 1 hour)
   */
  async getFileUrl(
    filePath: string,
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: filePath,
      });

      const signedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn,
      });

      return signedUrl;
    } catch (error: any) {
      console.error("❌ [Public Storage] Error generating signed URL:", error);
      // Fallback to public URL if CDN is configured
      if (this.cdnUrl) {
        return `${this.cdnUrl}/${filePath}`;
      }
      throw new Error(`Failed to generate file URL: ${error.message}`);
    }
  }

  /**
   * Delete file from DigitalOcean Spaces
   */
  async deleteFile(filePath: string): Promise<boolean> {
    try {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: filePath,
      });

      await this.s3Client.send(deleteCommand);
      console.log(`✅ [Public Storage] File deleted: ${filePath}`);
      return true;
    } catch (error: any) {
      console.error("❌ [Public Storage] Delete error:", error);
      return false;
    }
  }
}

export const storageService = new StorageService();
export default storageService;
