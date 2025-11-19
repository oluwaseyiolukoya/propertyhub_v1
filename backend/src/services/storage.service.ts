import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import https from "https";
import prisma from "../lib/db";
import path from "path";
import { v4 as uuidv4 } from "uuid";

interface UploadOptions {
  customerId: string;
  category: string;
  subcategory?: string;
  entityId?: string;
  file: {
    originalName: string;
    buffer: Buffer;
    mimetype: string;
    size: number;
  };
  uploadedBy: string;
  metadata?: Record<string, any>;
}

interface StorageQuota {
  used: number;
  limit: number;
  available: number;
  percentage: number;
  canUpload: boolean;
}

class StorageService {
  private s3Client: S3Client;
  private bucketName: string;
  private cdnUrl: string | null;
  private endpoint: string;

  constructor() {
    // Initialize Digital Ocean Spaces client (S3-compatible)
    this.endpoint = process.env.DO_SPACES_ENDPOINT || "https://nyc3.digitaloceanspaces.com";
    this.bucketName = process.env.DO_SPACES_BUCKET || "contrezz-uploads";
    this.cdnUrl = process.env.DO_SPACES_CDN_URL || null;

    // Create HTTPS agent that handles SSL certificates properly
    const httpsAgent = new https.Agent({
      rejectUnauthorized: process.env.NODE_ENV === "production",
    });

    this.s3Client = new S3Client({
      endpoint: this.endpoint,
      region: process.env.DO_SPACES_REGION || "nyc3",
      credentials: {
        accessKeyId: process.env.DO_SPACES_ACCESS_KEY_ID!,
        secretAccessKey: process.env.DO_SPACES_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: false, // Digital Ocean Spaces uses virtual-hosted-style URLs
      requestHandler: {
        httpsAgent: httpsAgent,
      },
    });

    console.log(`✅ Storage Service initialized with Digital Ocean Spaces`);
    console.log(`   Endpoint: ${this.endpoint}`);
    console.log(`   Bucket: ${this.bucketName}`);
    console.log(`   CDN: ${this.cdnUrl || "Not configured"}`);
  }

  /**
   * Generate storage path for a file
   */
  private generateStoragePath(options: UploadOptions): string {
    const { customerId, category, subcategory, entityId, file } = options;

    // Generate unique filename
    const ext = path.extname(file.originalName);
    const filename = `${uuidv4()}${ext}`;

    // Build path
    let storagePath = `customers/${customerId}/${category}`;

    if (entityId) {
      storagePath += `/${entityId}`;
    }

    if (subcategory) {
      storagePath += `/${subcategory}`;
    }

    storagePath += `/${filename}`;

    return storagePath;
  }

  /**
   * Check if customer has enough storage space
   */
  async checkStorageQuota(
    customerId: string,
    fileSize: number
  ): Promise<StorageQuota> {
    const customer = await prisma.customers.findUnique({
      where: { id: customerId },
      select: {
        storage_used: true,
        storage_limit: true,
      },
    });

    if (!customer) {
      throw new Error("Customer not found");
    }

    const used = Number(customer.storage_used) || 0;
    const limit = Number(customer.storage_limit) || 5368709120; // 5GB default
    const available = limit - used;
    const percentage = (used / limit) * 100;
    const canUpload = available >= fileSize;

    return {
      used,
      limit,
      available,
      percentage,
      canUpload,
    };
  }

  /**
   * Upload file to Digital Ocean Spaces
   */
  async uploadFile(options: UploadOptions): Promise<{
    success: boolean;
    fileId: string;
    filePath: string;
    fileUrl: string;
    cdnUrl?: string;
    fileSize: number;
  }> {
    const { customerId, file, uploadedBy, metadata } = options;

    // 1. Check storage quota
    const quota = await this.checkStorageQuota(customerId, file.size);

    if (!quota.canUpload) {
      throw new Error(
        `Storage quota exceeded. Used: ${this.formatBytes(
          quota.used
        )} / ${this.formatBytes(quota.limit)}`
      );
    }

    // 2. Generate storage path
    const storagePath = this.generateStoragePath(options);

    try {
      // 3. Upload to Digital Ocean Spaces
      const uploadCommand = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: storagePath,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: "private", // Keep files private by default
        Metadata: {
          customerId,
          originalName: file.originalName,
          uploadedBy,
          uploadDate: new Date().toISOString(),
          ...metadata,
        },
      });

      await this.s3Client.send(uploadCommand);

      console.log(`✅ File uploaded: ${storagePath}`);

      // 4. Update storage usage in database
      await this.updateStorageUsage(customerId, file.size, "add");

      // 5. Create storage transaction record
      const transaction = await prisma.storage_transactions.create({
        data: {
          customer_id: customerId,
          file_path: storagePath,
          file_name: file.originalName,
          file_size: BigInt(file.size),
          file_type: this.getFileType(file.mimetype),
          action: "upload",
          uploaded_by: uploadedBy,
          metadata: metadata || {},
        },
      });

      // 6. Update storage usage breakdown
      await this.updateStorageBreakdown(
        customerId,
        this.getFileType(file.mimetype),
        options.subcategory || options.category,
        file.size,
        "add"
      );

      // 7. Generate file URLs
      const fileUrl = await this.getFileUrl(storagePath);
      const cdnUrl = this.cdnUrl
        ? `${this.cdnUrl}/${storagePath}`
        : undefined;

      return {
        success: true,
        fileId: transaction.id,
        filePath: storagePath,
        fileUrl,
        cdnUrl,
        fileSize: file.size,
      };
    } catch (error: any) {
      console.error("Storage upload error:", error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Delete file from Digital Ocean Spaces
   */
  async deleteFile(customerId: string, filePath: string): Promise<boolean> {
    try {
      // 1. Get file info from transaction log
      const transaction = await prisma.storage_transactions.findFirst({
        where: {
          customer_id: customerId,
          file_path: filePath,
        },
        orderBy: {
          created_at: "desc",
        },
      });

      if (!transaction) {
        throw new Error("File not found");
      }

      // 2. Delete from Digital Ocean Spaces
      const deleteCommand = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: filePath,
      });

      await this.s3Client.send(deleteCommand);

      console.log(`✅ File deleted: ${filePath}`);

      // 3. Update storage usage
      await this.updateStorageUsage(
        customerId,
        Number(transaction.file_size),
        "subtract"
      );

      // 4. Update storage breakdown
      await this.updateStorageBreakdown(
        customerId,
        transaction.file_type || "other",
        "general",
        Number(transaction.file_size),
        "subtract"
      );

      // 5. Log deletion
      await prisma.storage_transactions.create({
        data: {
          customer_id: customerId,
          file_path: filePath,
          file_name: transaction.file_name,
          file_size: transaction.file_size,
          file_type: transaction.file_type,
          action: "delete",
          uploaded_by: transaction.uploaded_by,
        },
      });

      return true;
    } catch (error: any) {
      console.error("Storage delete error:", error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Get signed URL for file access (expires in 1 hour by default)
   */
  async getFileUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: filePath,
    });

    const url = await getSignedUrl(this.s3Client, command, { expiresIn });
    return url;
  }

  /**
   * Get public CDN URL (if CDN is enabled)
   */
  getCdnUrl(filePath: string): string | null {
    if (!this.cdnUrl) {
      return null;
    }
    return `${this.cdnUrl}/${filePath}`;
  }

  /**
   * Check if file exists in Digital Ocean Spaces
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: filePath,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get metadata (size, content type, last modified) for a file in Spaces
   */
  async getFileMetadata(filePath: string): Promise<{
    size: number;
    contentType?: string;
    lastModified?: Date;
  }> {
    const command = new HeadObjectCommand({
      Bucket: this.bucketName,
      Key: filePath,
    });

    const response = await this.s3Client.send(command);

    return {
      size: Number(response.ContentLength ?? 0),
      contentType: response.ContentType ?? undefined,
      lastModified: response.LastModified ?? undefined,
    };
  }

  /**
   * Update customer storage usage
   */
  private async updateStorageUsage(
    customerId: string,
    fileSize: number,
    operation: "add" | "subtract"
  ): Promise<void> {
    const increment = operation === "add" ? fileSize : -fileSize;

    await prisma.customers.update({
      where: { id: customerId },
      data: {
        storage_used: {
          increment: BigInt(increment),
        },
        storage_last_calculated: new Date(),
      },
    });
  }

  /**
   * Update storage breakdown by category
   */
  private async updateStorageBreakdown(
    customerId: string,
    fileType: string,
    category: string,
    fileSize: number,
    operation: "add" | "subtract"
  ): Promise<void> {
    const increment = operation === "add" ? fileSize : -fileSize;
    const countIncrement = operation === "add" ? 1 : -1;

    await prisma.storage_usage.upsert({
      where: {
        customer_id_file_type_category: {
          customer_id: customerId,
          file_type: fileType,
          category,
        },
      },
      create: {
        customer_id: customerId,
        file_type: fileType,
        category,
        file_count: countIncrement > 0 ? 1 : 0,
        total_size: BigInt(fileSize),
      },
      update: {
        file_count: {
          increment: countIncrement,
        },
        total_size: {
          increment: BigInt(increment),
        },
        last_updated: new Date(),
      },
    });
  }

  /**
   * Get storage statistics for customer
   */
  async getStorageStats(customerId: string): Promise<{
    quota: StorageQuota;
    breakdown: Array<{
      fileType: string;
      category: string;
      fileCount: number;
      totalSize: number;
      percentage: number;
    }>;
    recentUploads: Array<{
      fileName: string;
      fileSize: number;
      uploadedAt: Date;
      uploadedBy: string;
    }>;
  }> {
    // Get quota
    const customer = await prisma.customers.findUnique({
      where: { id: customerId },
      select: {
        storage_used: true,
        storage_limit: true,
      },
    });

    const used = Number(customer?.storage_used) || 0;
    const limit = Number(customer?.storage_limit) || 5368709120;
    const available = limit - used;
    const percentage = (used / limit) * 100;

    const quota: StorageQuota = {
      used,
      limit,
      available,
      percentage,
      canUpload: available > 0,
    };

    // Get breakdown
    const breakdownData = await prisma.storage_usage.findMany({
      where: { customer_id: customerId },
      orderBy: { total_size: "desc" },
    });

    const breakdown = breakdownData.map((item) => ({
      fileType: item.file_type,
      category: item.category || "general",
      fileCount: item.file_count,
      totalSize: Number(item.total_size),
      percentage: used > 0 ? (Number(item.total_size) / used) * 100 : 0,
    }));

    // Get recent uploads
    const recentTransactions = await prisma.storage_transactions.findMany({
      where: {
        customer_id: customerId,
        action: "upload",
      },
      orderBy: { created_at: "desc" },
      take: 10,
      include: {
        users: {
          select: { name: true },
        },
      },
    });

    const recentUploads = recentTransactions.map((tx) => ({
      fileName: tx.file_name,
      fileSize: Number(tx.file_size),
      uploadedAt: tx.created_at,
      uploadedBy: tx.users?.name || "Unknown",
    }));

    return {
      quota,
      breakdown,
      recentUploads,
    };
  }

  /**
   * Recalculate storage usage (for maintenance/audit)
   */
  async recalculateStorageUsage(customerId: string): Promise<number> {
    const transactions = await prisma.storage_transactions.findMany({
      where: {
        customer_id: customerId,
        action: "upload",
      },
    });

    const totalSize = transactions.reduce((sum, tx) => sum + Number(tx.file_size), 0);

    await prisma.customers.update({
      where: { id: customerId },
      data: {
        storage_used: BigInt(totalSize),
        storage_last_calculated: new Date(),
      },
    });

    return totalSize;
  }

  /**
   * Helper: Get file type from mimetype
   */
  getFileType(mimetype: string): string {
    if (mimetype.startsWith("image/")) return "image";
    if (mimetype.startsWith("video/")) return "video";
    if (mimetype.startsWith("audio/")) return "audio";
    if (mimetype.includes("pdf")) return "document";
    if (mimetype.includes("word")) return "document";
    if (mimetype.includes("excel") || mimetype.includes("spreadsheet"))
      return "document";
    if (mimetype.includes("powerpoint") || mimetype.includes("presentation"))
      return "document";
    return "other";
  }

  /**
   * Helper: Format bytes to human-readable
   */
  formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  }
}

export const storageService = new StorageService();
export default storageService;

