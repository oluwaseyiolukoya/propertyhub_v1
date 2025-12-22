import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import PDFDocument from "pdfkit";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  UnderlineType,
} from "docx";
import { convert } from "html-to-text";
import { emitToUser } from "../lib/socket";
import storageService from "../services/storage.service";

const router = Router();
const prisma = new PrismaClient();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Configure multer for memory storage (files will be uploaded to Digital Ocean Spaces)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log("File upload attempt:", {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    });

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
      "image/jpg",
      "image/gif",
      "image/webp",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
      "text/csv",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      console.log("File type allowed");
      cb(null, true);
    } else {
      console.error("File type rejected:", file.mimetype);
      cb(
        new Error(
          `Invalid file type: ${file.mimetype}. Only PDF, DOC, DOCX, images, Excel, and text files allowed.`
        )
      );
    }
  },
});

// Get all documents (with filters)
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const { propertyId, unitId, tenantId, type, category, status } = req.query;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Build filter based on role
    let whereClause: any = {};

    if (role === "owner" || role === "property_owner") {
      // Owner can see documents for their properties
      const ownerProperties = await prisma.properties.findMany({
        where: { ownerId: userId },
        select: { id: true, customerId: true },
      });

      const propertyIds = ownerProperties.map((p) => p.id);
      const customerId = ownerProperties[0]?.customerId;

      // Build OR conditions only if we have valid IDs
      const orConditions: any[] = [];

      if (propertyIds.length > 0) {
        orConditions.push({ propertyId: { in: propertyIds } });
      }

      if (customerId) {
        orConditions.push({ customerId: customerId });
      }

      // If no properties or customerId, still allow documents uploaded by this user
      if (orConditions.length === 0) {
        orConditions.push({ uploadedById: userId });
      }

      whereClause = {
        OR: orConditions,
      };

      console.log(
        "[Document List] Owner whereClause:",
        JSON.stringify(whereClause)
      );
    } else if (role === "manager" || role === "property_manager") {
      // Manager can see documents they created, are assigned to, or are shared with them
      const managedProperties = await prisma.property_managers.findMany({
        where: {
          managerId: userId,
          isActive: true,
        },
        select: { propertyId: true },
      });

      const propertyIds = managedProperties.map((pm) => pm.propertyId);

      // Get owner user IDs to filter shared documents
      // Only show documents shared by owners (not by other managers or tenants)
      const ownerUsers = await prisma.users.findMany({
        where: {
          role: {
            in: ["owner", "property_owner", "property owner"],
          },
        },
        select: { id: true },
      });
      const ownerUserIds = ownerUsers.map((u) => u.id);

      // Build OR conditions for manager document access
      const orConditions: any[] = [];

      // Only add shared documents condition if there are owner users
      if (ownerUserIds.length > 0) {
        // Documents shared with this manager by owners only (regardless of property)
        // Only show ACTIVE shared documents (inactive/deleted shared docs should not be visible)
        orConditions.push({
          AND: [
            { isShared: true },
            { sharedWith: { has: userId } },
            { uploadedById: { in: ownerUserIds } }, // Only documents uploaded/shared by owners
            { status: "active" }, // Only active shared documents
          ],
        });
      }

      // If manager has properties, add documents for those properties
      if (propertyIds.length > 0) {
        orConditions.push({
          AND: [
            { propertyId: { in: propertyIds } },
            {
              OR: [
                { uploadedById: userId }, // Documents uploaded by this manager
                { managerId: userId }, // Documents assigned to this manager
              ],
            },
          ],
        });
      } else {
        // If no properties, still allow documents uploaded by or assigned to this manager
        orConditions.push({
          OR: [{ uploadedById: userId }, { managerId: userId }],
        });
      }

      whereClause = { OR: orConditions };
    } else if (role === "tenant") {
      // Tenant can see:
      // 1. Documents assigned to them (tenantId = userId) AND status = 'active'
      // 2. Documents shared with them (isShared = true AND sharedWith contains userId) AND status = 'active'
      const tenantStatus =
        status && status !== "" ? (status as string) : "active";

      whereClause = {
        AND: [
          {
            OR: [
              { tenantId: userId },
              {
                AND: [{ isShared: true }, { sharedWith: { has: userId } }],
              },
            ],
          },
          { status: tenantStatus },
        ],
      };
    } else {
      return res.status(403).json({ error: "Access denied" });
    }

    // Add additional filters (only for non-tenant roles, as tenant query is already complete)
    if (role !== "tenant") {
      if (propertyId) whereClause.propertyId = propertyId as string;
      if (unitId) whereClause.unitId = unitId as string;
      if (
        tenantId &&
        (role === "owner" ||
          role === "property_owner" ||
          role === "manager" ||
          role === "property_manager")
      ) {
        whereClause.tenantId = tenantId as string;
      }
      if (type) whereClause.type = type as string;
      if (category) whereClause.category = category as string;
      // Status filtering rules
      // - Owners: by default show everything except deleted
      // - Managers: by default show active, draft, and inactive documents (their own drafts and inactive docs)
      if (status && status !== "") {
        whereClause.status = status as string;
      } else {
        if (role === "manager" || role === "property_manager") {
          // Managers can see active, draft, and inactive documents
          whereClause.status = { in: ["active", "draft", "inactive"] };
        } else {
          // Owners can see everything except deleted
          whereClause.status = { not: "deleted" };
        }
      }
    } else {
      // For tenants, add optional filters if provided
      const additionalFilters: any[] = [];
      if (propertyId) {
        additionalFilters.push({ propertyId: propertyId as string });
      }
      if (unitId) {
        additionalFilters.push({ unitId: unitId as string });
      }
      if (type) {
        additionalFilters.push({ type: type as string });
      }
      if (category) {
        additionalFilters.push({ category: category as string });
      }

      if (additionalFilters.length > 0) {
        whereClause.AND = [...whereClause.AND, ...additionalFilters];
      }
    }

    // Debug logging for tenant document queries
    if (role === "tenant") {
      console.log("[Documents API] Tenant query filters:", {
        userId,
        whereClause: JSON.stringify(whereClause, null, 2),
      });
    }

    const documents = await prisma.documents.findMany({
      where: whereClause,
      include: {
        properties: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        units: {
          select: {
            id: true,
            unitNumber: true,
            type: true,
          },
        },
        users_documents_tenantIdTousers: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        users_documents_managerIdTousers: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        users_documents_uploadedByIdTousers: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Debug logging for tenant queries
    if (role === "tenant") {
      console.log("[Documents API] Tenant document query results:", {
        userId,
        documentsFound: documents.length,
        documentIds: documents.map((d) => d.id),
        documentTenantIds: documents.map((d) => d.tenantId),
        documentStatuses: documents.map((d) => d.status),
        documentIsShared: documents.map((d) => d.isShared),
        documentSharedWith: documents.map((d) => d.sharedWith),
        whereClause: JSON.stringify(whereClause),
      });
    }

    return res.json(documents);
  } catch (error: any) {
    console.error("Get documents error:", error);
    return res.status(500).json({ error: "Failed to fetch documents" });
  }
});

// Get single document
router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const role = req.user?.role;

    const document = await prisma.documents.findUnique({
      where: { id },
      include: {
        properties: true,
        units: true,
        users_documents_tenantIdTousers: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        users_documents_managerIdTousers: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        users_documents_uploadedByIdTousers: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Check access permissions
    const hasAccess = await checkDocumentAccess(userId!, role!, document);
    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    return res.json(document);
  } catch (error: any) {
    console.error("Get document error:", error);
    return res.status(500).json({ error: "Failed to fetch document" });
  }
});

// Create document (without file upload - for generated contracts)
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    const {
      name,
      type,
      category,
      description,
      propertyId,
      unitId,
      tenantId,
      managerId,
      status,
      metadata,
      isShared,
      sharedWith,
      expiresAt,
    } = req.body;

    // Get customerId based on role
    let customerId: string = "";
    if (role === "owner" || role === "property_owner") {
      if (!propertyId) {
        return res
          .status(400)
          .json({ error: "Property ID required for owners" });
      }
      const property = await prisma.properties.findFirst({
        where: {
          id: propertyId,
          ownerId: userId,
        },
      });
      if (!property) {
        return res
          .status(403)
          .json({ error: "Access denied to this property" });
      }
      customerId = property.customerId;
    } else if (role === "manager" || role === "property_manager") {
      if (!propertyId) {
        return res
          .status(400)
          .json({ error: "Property ID required for managers" });
      }
      const assignment = await prisma.property_managers.findFirst({
        where: {
          propertyId,
          managerId: userId,
          isActive: true,
        },
        include: {
          properties: true,
        },
      });
      if (!assignment) {
        return res
          .status(403)
          .json({ error: "Access denied to this property" });
      }
      customerId = assignment.properties.customerId;
    } else {
      return res.status(403).json({ error: "Access denied" });
    }

    // Get uploader name
    const uploader = await prisma.users.findUnique({
      where: { id: userId },
      select: { name: true, role: true },
    });

    // If the uploader is a manager, set managerId to their ID
    const finalManagerId =
      role === "manager" || role === "property_manager"
        ? userId
        : managerId || null;

    const document = await prisma.documents.create({
      data: {
        id: crypto.randomUUID(),
        customerId,
        propertyId: propertyId || null,
        unitId: unitId || null,
        tenantId: tenantId || null,
        managerId: finalManagerId,
        name,
        type,
        category,
        fileUrl: "", // No file for generated contracts
        fileSize: 0,
        format: "TEXT",
        description: description || null,
        uploadedBy: uploader?.name || "Unknown",
        uploadedById: userId!,
        status: status || "draft",
        metadata: metadata || {},
        isShared: isShared === "true" || isShared === true,
        sharedWith: sharedWith
          ? typeof sharedWith === "string"
            ? [sharedWith]
            : sharedWith
          : [],
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        updatedAt: new Date(),
      },
      include: {
        properties: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
    });

    return res.status(201).json(document);
  } catch (error: any) {
    console.error("Create document error:", error);
    return res.status(500).json({ error: "Failed to create document" });
  }
});

// Upload document
router.post(
  "/upload",
  (req: AuthRequest, res: Response, next) => {
    upload.single("file")(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        console.error("Multer error:", err);
        if (err.code === "LIMIT_FILE_SIZE") {
          return res
            .status(400)
            .json({ error: "File size too large. Maximum size is 10MB." });
        }
        return res.status(400).json({ error: `Upload error: ${err.message}` });
      } else if (err) {
        console.error("File filter error:", err);
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  },
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const role = req.user?.role;
      const file = req.file;

      console.log("Upload request received:", {
        userId,
        role,
        hasFile: !!file,
        body: req.body,
      });

      if (!file) {
        console.error("No file uploaded");
        return res.status(400).json({ error: "No file uploaded" });
      }

      const {
        name,
        type,
        category,
        description,
        propertyId,
        unitId,
        tenantId,
        managerId,
        isShared,
        sharedWith,
        expiresAt,
      } = req.body;

      console.log("Parsed request data:", {
        name,
        type,
        category,
        propertyId,
        unitId,
        tenantId,
        managerId,
      });

      // Get customerId based on role
      let customerId: string = "";
      if (role === "owner" || role === "property_owner") {
        if (propertyId) {
          // If property is provided, verify access
          const property = await prisma.properties.findFirst({
            where: {
              id: propertyId,
              ownerId: userId,
            },
          });
          if (!property) {
            return res
              .status(403)
              .json({ error: "Access denied to this property" });
          }
          customerId = property.customerId;
        } else {
          // If no property, try to get customerId from any of the owner's properties
          const anyProperty = await prisma.properties.findFirst({
            where: { ownerId: userId },
            select: { customerId: true },
          });
          if (!anyProperty) {
            // Fallback: use owner's customerId directly
            const ownerUser = await prisma.users.findUnique({
              where: { id: userId },
              select: { customerId: true },
            });
            if (!ownerUser?.customerId) {
              console.error(
                "Upload fallback failed: owner has no properties and no customerId"
              );
              return res
                .status(400)
                .json({ error: "Unable to determine customer for this owner" });
            }
            console.log(
              "Fallback to owner.customerId for upload:",
              ownerUser.customerId
            );
            customerId = ownerUser.customerId;
          } else {
            customerId = anyProperty.customerId;
          }
        }
      } else if (role === "manager" || role === "property_manager") {
        if (!propertyId) {
          return res
            .status(400)
            .json({ error: "Property ID required for managers" });
        }
        const assignment = await prisma.property_managers.findFirst({
          where: {
            propertyId,
            managerId: userId,
            isActive: true,
          },
          include: {
            properties: true,
          },
        });
        if (!assignment) {
          return res
            .status(403)
            .json({ error: "Access denied to this property" });
        }
        customerId = assignment.properties.customerId;
      } else {
        return res.status(403).json({ error: "Access denied" });
      }

      console.log("CustomerId determined:", customerId);

      // Get uploader name
      const uploader = await prisma.users.findUnique({
        where: { id: userId },
        select: { name: true, role: true },
      });

      const format = path.extname(file.originalname).substring(1).toUpperCase();

      // Validate customerId before upload
      if (!customerId) {
        console.error("Upload failed: customerId is missing", {
          userId,
          role,
          propertyId,
        });
        return res.status(400).json({
          error: "Unable to determine customer account",
          details:
            "Please ensure you have a valid property or customer association",
        });
      }

      // Validate Spaces configuration
      if (
        !process.env.DO_SPACES_ACCESS_KEY_ID ||
        !process.env.DO_SPACES_SECRET_ACCESS_KEY
      ) {
        console.error("Upload failed: Spaces credentials not configured");
        return res.status(500).json({
          error: "Cloud storage not configured",
          details:
            "Digital Ocean Spaces credentials are missing. Please configure DO_SPACES_ACCESS_KEY_ID and DO_SPACES_SECRET_ACCESS_KEY in your environment variables.",
        });
      }

      // Upload to Digital Ocean Spaces only (no fallback to local storage)
      console.log("Uploading file to Digital Ocean Spaces:", {
        originalname: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        format,
        customerId,
        bucket: process.env.DO_SPACES_BUCKET || "contrezz-uploads",
      });

      let uploadResult;
      try {
        uploadResult = await storageService.uploadFile({
          customerId,
          category: "documents",
          subcategory: type,
          entityId: propertyId || undefined,
          file: {
            originalName: file.originalname,
            buffer: file.buffer,
            mimetype: file.mimetype,
            size: file.size,
          },
          uploadedBy: userId!, // Pass user ID, not name - storage_transactions.uploaded_by is a FK to users.id
          metadata: {
            documentType: type,
            documentCategory: category,
            propertyId: propertyId || null,
            unitId: unitId || null,
            tenantId: tenantId || null,
            uploaderName: uploader?.name || "System", // Store name in metadata if needed
          },
        });
      } catch (uploadError: any) {
        console.error("Spaces upload failed:", {
          error: uploadError.message,
          stack: uploadError.stack,
          customerId,
          fileName: file.originalname,
        });
        return res.status(500).json({
          error: "Failed to upload file to cloud storage",
          details:
            uploadError.message ||
            "Please check your Digital Ocean Spaces configuration",
        });
      }

      const fileUrl = uploadResult.filePath;
      console.log("✅ File uploaded to Spaces:", {
        filePath: uploadResult.filePath,
        fileSize: uploadResult.fileSize,
      });

      // If the uploader is a manager, set managerId to their ID
      const finalManagerId =
        role === "manager" || role === "property_manager"
          ? userId
          : managerId || null;

      const document = await prisma.documents.create({
        data: {
          id: crypto.randomUUID(),
          customerId,
          propertyId: propertyId || null,
          unitId: unitId || null,
          tenantId: tenantId || null,
          managerId: finalManagerId,
          name: name || file.originalname,
          type,
          category,
          fileUrl, // Store Spaces file path
          fileSize: file.size,
          format,
          description: description || null,
          uploadedBy: uploader?.name || "System",
          uploadedById: userId!,
          status: "active",
          isShared: isShared === "true" || isShared === true,
          sharedWith: sharedWith ? JSON.parse(sharedWith) : [],
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          updatedAt: new Date(),
          metadata: {
            uploadedToSpaces: true,
            storageType: "spaces",
          },
        },
      });

      // Log activity
      await prisma.activity_logs.create({
        data: {
          id: crypto.randomUUID(),
          customerId,
          userId: userId!,
          action: "upload",
          entity: "document",
          entityId: document.id,
          description: `Uploaded document: ${document.name}`,
        },
      });

      console.log("Document created successfully:", document.id);
      return res.status(201).json(document);
    } catch (error: any) {
      console.error("Upload document error:", error);
      console.error("Error stack:", error.stack);

      // Provide more specific error messages
      let errorMessage = "Failed to upload document";
      let errorDetails = error.message || "Unknown error";

      if (error.message?.includes("Storage quota exceeded")) {
        errorMessage = "Storage quota exceeded";
        errorDetails = error.message;
      } else if (
        error.message?.includes("credentials") ||
        error.message?.includes("AccessDenied")
      ) {
        errorMessage = "Cloud storage configuration error";
        errorDetails = "Please check your Digital Ocean Spaces credentials";
      } else if (
        error.message?.includes("ENOTFOUND") ||
        error.message?.includes("ECONNREFUSED")
      ) {
        errorMessage = "Cannot connect to cloud storage";
        errorDetails =
          "Please check your network connection and Spaces endpoint";
      }

      return res.status(500).json({
        error: errorMessage,
        details: errorDetails,
      });
    }
  }
);

// Update document
router.put("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const role = req.user?.role;
    const {
      name,
      type,
      category,
      description,
      status,
      metadata,
      isShared,
      sharedWith,
      expiresAt,
    } = req.body;

    const document = await prisma.documents.findUnique({
      where: { id },
    });

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Check access permissions
    const hasAccess = await checkDocumentAccess(userId!, role!, document);
    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    const updatedDocument = await prisma.documents.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(category && { category }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(metadata !== undefined && { metadata }),
        ...(isShared !== undefined && { isShared }),
        ...(sharedWith && { sharedWith }),
        ...(expiresAt !== undefined && {
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        }),
        updatedAt: new Date(),
      },
      include: {
        properties: true,
        units: true,
        users_documents_tenantIdTousers: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Log activity
    await prisma.activity_logs.create({
      data: {
        id: crypto.randomUUID(),
        customerId: document.customerId,
        userId: userId!,
        action: "update",
        entity: "document",
        entityId: id,
        description: `Updated document: ${document.name}`,
      },
    });

    // Emit real-time updates to affected users
    try {
      const previousSharedWith = document.sharedWith || [];
      const newSharedWith = sharedWith || document.sharedWith || [];
      const previousStatus = document.status;
      const newStatus = status || document.status;

      // Find users who were removed from sharing
      const removedUsers = previousSharedWith.filter(
        (uid: string) => !newSharedWith.includes(uid)
      );

      // If document became inactive or was unshared, notify previously shared users
      if (
        newStatus === "inactive" ||
        newStatus === "deleted" ||
        isShared === false
      ) {
        // Notify all previously shared users
        for (const uid of previousSharedWith) {
          emitToUser(uid, "document:updated", {
            documentId: id,
            action: "removed",
            reason:
              newStatus === "inactive"
                ? "document_inactive"
                : newStatus === "deleted"
                ? "document_deleted"
                : "sharing_removed",
            timestamp: new Date().toISOString(),
          });
        }
      } else if (removedUsers.length > 0) {
        // Notify users who were removed from sharing
        for (const uid of removedUsers) {
          emitToUser(uid, "document:updated", {
            documentId: id,
            action: "removed",
            reason: "sharing_removed",
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Notify users who still have access about the update
      const stillSharedWith = newSharedWith.filter(
        (uid: string) => !removedUsers.includes(uid)
      );
      for (const uid of stillSharedWith) {
        emitToUser(uid, "document:updated", {
          documentId: id,
          action: "updated",
          timestamp: new Date().toISOString(),
        });
      }

      // Only log if there were actual updates to emit
      if (removedUsers.length > 0 || stillSharedWith.length > 0) {
        console.log(
          `[Documents] Emitted real-time updates for document ${id}:`,
          {
            removedUsers: removedUsers.length,
            stillShared: stillSharedWith.length,
            statusChange: previousStatus !== newStatus,
          }
        );
      }
    } catch (socketError) {
      // Don't fail the request if socket emission fails - silently ignore
      // This happens when socket.io is not initialized (e.g., in development)
    }

    return res.json(updatedDocument);
  } catch (error: any) {
    console.error("Update document error:", error);
    return res.status(500).json({ error: "Failed to update document" });
  }
});

// Delete document
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const role = req.user?.role;

    const document = await prisma.documents.findUnique({
      where: { id },
    });

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Check access permissions
    const hasAccess = await checkDocumentAccess(userId!, role!, document);
    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Log activity before deletion
    await prisma.activity_logs.create({
      data: {
        id: crypto.randomUUID(),
        customerId: document.customerId,
        userId: userId!,
        action: "delete",
        entity: "document",
        entityId: id,
        description: `Deleted document: ${document.name}`,
      },
    });

    // Delete the physical file (from Spaces or local storage)
    if (document.fileUrl && document.fileUrl !== "") {
      const isLocalFile = document.fileUrl.startsWith("/uploads/");

      if (isLocalFile) {
        // Delete local file
        const filePath = path.join(__dirname, "../..", document.fileUrl);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
            console.log("Local file deleted:", document.fileUrl);
          } catch (err) {
            console.error("Failed to delete local file:", err);
          }
        }
      } else {
        // Delete from Spaces
        try {
          const fileExists = await storageService.fileExists(document.fileUrl);
          if (fileExists) {
            await storageService.deleteFile(
              document.customerId,
              document.fileUrl
            );
            console.log("File deleted from Spaces:", document.fileUrl);
          }
        } catch (err) {
          console.error("Failed to delete file from Spaces:", err);
        }
      }
    }

    // Hard delete - permanently remove from database
    await prisma.documents.delete({
      where: { id },
    });

    return res.json({ message: "Document deleted successfully" });
  } catch (error: any) {
    console.error("Delete document error:", error);
    return res.status(500).json({ error: "Failed to delete document" });
  }
});

// Get document stats
router.get("/stats/summary", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    let whereClause: any = {};

    if (role === "owner" || role === "property_owner") {
      // Owner can see all documents (excluding deleted)
      const ownerProperties = await prisma.properties.findMany({
        where: { ownerId: userId },
        select: { id: true, customerId: true },
      });

      const propertyIds = ownerProperties.map((p) => p.id);
      const customerId = ownerProperties[0]?.customerId;

      // Build OR conditions only if we have valid IDs
      const orConditions: any[] = [];

      if (propertyIds.length > 0) {
        orConditions.push({ propertyId: { in: propertyIds } });
      }

      if (customerId) {
        orConditions.push({ customerId: customerId });
      }

      // If no properties or customerId, still allow documents uploaded by this user
      if (orConditions.length === 0) {
        orConditions.push({ uploadedById: userId });
      }

      whereClause = {
        OR: orConditions,
        status: { not: "deleted" },
      };

      console.log(
        "[Document Stats] Owner whereClause:",
        JSON.stringify(whereClause)
      );
    } else if (role === "manager" || role === "property_manager") {
      // Manager can see documents they created, are assigned to, or are shared with them
      const managedProperties = await prisma.property_managers.findMany({
        where: {
          managerId: userId,
          isActive: true,
        },
        select: { propertyId: true },
      });

      const propertyIds = managedProperties.map((pm) => pm.propertyId);

      // Get owner user IDs to filter shared documents
      // Only show documents shared by owners (not by other managers or tenants)
      const ownerUsers = await prisma.users.findMany({
        where: {
          role: {
            in: ["owner", "property_owner", "property owner"],
          },
        },
        select: { id: true },
      });
      const ownerUserIds = ownerUsers.map((u) => u.id);

      // Build OR conditions for manager document access (matching the list query logic)
      const orConditions: any[] = [];

      // Only add shared documents condition if there are owner users
      if (ownerUserIds.length > 0) {
        // Documents shared with this manager by owners only (regardless of property)
        orConditions.push({
          AND: [
            { isShared: true },
            { sharedWith: { has: userId } },
            { uploadedById: { in: ownerUserIds } }, // Only documents uploaded/shared by owners
            { status: { in: ["active", "draft", "inactive"] } },
          ],
        });
      }

      // If manager has properties, add documents for those properties
      if (propertyIds.length > 0) {
        orConditions.push({
          AND: [
            { propertyId: { in: propertyIds } },
            {
              OR: [
                { uploadedById: userId }, // Documents uploaded by this manager
                { managerId: userId }, // Documents assigned to this manager
              ],
            },
            { status: { in: ["active", "draft", "inactive"] } },
          ],
        });
      } else {
        // If no properties, still allow documents uploaded by or assigned to this manager
        orConditions.push({
          AND: [
            {
              OR: [{ uploadedById: userId }, { managerId: userId }],
            },
            { status: { in: ["active", "draft", "inactive"] } },
          ],
        });
      }

      whereClause = { OR: orConditions };
    } else if (role === "tenant") {
      // Tenant can only see their own active documents
      whereClause = {
        tenantId: userId,
        status: "active",
      };
    } else {
      return res.status(403).json({ error: "Access denied" });
    }

    const [total, byType, recent] = await Promise.all([
      prisma.documents.count({ where: whereClause }),
      prisma.documents.groupBy({
        by: ["type"],
        where: whereClause,
        _count: true,
      }),
      prisma.documents.count({
        where: {
          ...whereClause,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      }),
    ]);

    return res.json({
      total,
      byType,
      recent,
      pending: 0, // Placeholder for future functionality
    });
  } catch (error: any) {
    console.error("Get document stats error:", error);
    return res.status(500).json({ error: "Failed to fetch document stats" });
  }
});

// Download document in specified format (PDF or DOCX)
// Note: authMiddleware already handles token from query string, so req.user should be set
router.get("/:id/download/:format", async (req: AuthRequest, res: Response) => {
  try {
    const { id, format } = req.params;
    const userId = req.user?.id;
    const role = req.user?.role;
    const inline = req.query.inline === "1" || req.query.inline === "true";

    // Ensure user is authenticated (authMiddleware should have set this, but double-check)
    if (!userId || !role) {
      console.error("[Document Download] No user in request:", {
        hasUser: !!req.user,
        hasToken: !!req.query.token,
        path: req.path,
      });
      return res.status(401).json({ error: "Authentication required" });
    }

    // Supported formats for download - includes images and common file types
    const supportedFormats = [
      "pdf",
      "docx",
      "doc",
      "jpg",
      "jpeg",
      "png",
      "gif",
      "xls",
      "xlsx",
      "txt",
      "csv",
    ];
    if (!supportedFormats.includes(format.toLowerCase())) {
      return res.status(400).json({
        error: `Invalid format. Supported formats: ${supportedFormats.join(
          ", "
        )}`,
      });
    }

    const document = await prisma.documents.findUnique({
      where: { id },
      include: {
        properties: true,
        users_documents_tenantIdTousers: true,
        users_documents_managerIdTousers: true,
      },
    });

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Check access permissions
    console.log("Download access check:", {
      userId,
      role,
      documentId: document.id,
      documentUploadedById: document.uploadedById,
      documentManagerId: document.managerId,
      documentPropertyId: document.propertyId,
    });

    const hasAccess = await checkDocumentAccess(userId!, role!, document);
    console.log("Download access result:", hasAccess);

    if (!hasAccess) {
      console.error("Download access denied for user:", userId, "role:", role);
      return res.status(403).json({ error: "Access denied" });
    }

    // Get content from metadata (for generated contracts)
    const content = document.metadata?.content || "";

    // If there's no rich text content, try serving the original uploaded file
    if (!content) {
      if (document.fileUrl) {
        const requestedFormat = format.toLowerCase();
        const originalFormat = (
          document.format || path.extname(document.fileUrl).substring(1)
        ).toLowerCase();

        // Only serve directly if requested format matches original
        if (requestedFormat === originalFormat) {
          // Check if this is a local file path (backward compatibility) or Spaces path
          const isLocalFile = document.fileUrl.startsWith("/uploads/");

          if (isLocalFile) {
            // Legacy local file - serve from disk
            console.log("[Document Download] Serving local file:", {
              originalFileUrl: document.fileUrl,
              format: originalFormat,
            });

            const fileUrlPath = document.fileUrl.startsWith("/")
              ? document.fileUrl.substring(1)
              : document.fileUrl;
            const filePath = path.resolve(__dirname, "../..", fileUrlPath);

            if (!fs.existsSync(filePath)) {
              console.error("Download error: local file not found", filePath);
              return res.status(404).json({
                error: "File not found on server",
                details:
                  "This file may have been uploaded before migration to cloud storage",
              });
            }

            // Set appropriate content type
            const mimeMap: Record<string, string> = {
              pdf: "application/pdf",
              doc: "application/msword",
              docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
              jpg: "image/jpeg",
              jpeg: "image/jpeg",
              png: "image/png",
              gif: "image/gif",
              webp: "image/webp",
              xls: "application/vnd.ms-excel",
              xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              txt: "text/plain",
              csv: "text/csv",
            };
            const contentType =
              mimeMap[originalFormat] || "application/octet-stream";
            const sanitizedName = document.name
              .replace(/[^a-z0-9]/gi, "_")
              .toLowerCase();

            res.setHeader("Content-Type", contentType);
            res.setHeader(
              "Content-Disposition",
              `${
                inline ? "inline" : "attachment"
              }; filename="${sanitizedName}.${originalFormat}"`
            );

            const stream = fs.createReadStream(filePath);
            stream.pipe(res);
            return;
          } else {
            // Spaces file - serve via signed URL
            console.log(
              "[Document Download] Generating signed URL from Spaces:",
              {
                originalFileUrl: document.fileUrl,
                format: originalFormat,
              }
            );

            try {
              // Check if file exists in Spaces
              const fileExists = await storageService.fileExists(
                document.fileUrl
              );
              if (!fileExists) {
                console.error(
                  "Download error: file not found in Spaces",
                  document.fileUrl
                );
                return res.status(404).json({
                  error: "File not found in cloud storage",
                  details: "The file may have been deleted or moved",
                });
              }

              console.log(
                "[Document Download] Streaming file from Spaces through backend"
              );

              // Stream file through backend to avoid CORS issues
              const { stream, contentType, contentLength } =
                await storageService.getFileStream(document.fileUrl);

              // Set appropriate headers
              const mimeMap: Record<string, string> = {
                pdf: "application/pdf",
                doc: "application/msword",
                docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                jpg: "image/jpeg",
                jpeg: "image/jpeg",
                png: "image/png",
                gif: "image/gif",
                webp: "image/webp",
                xls: "application/vnd.ms-excel",
                xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                csv: "text/csv",
                txt: "text/plain",
                zip: "application/zip",
                rar: "application/x-rar-compressed",
              };

              const finalContentType =
                contentType ||
                mimeMap[originalFormat] ||
                "application/octet-stream";
              const sanitizedName = document.name
                .replace(/[^a-z0-9]/gi, "_")
                .toLowerCase();

              res.setHeader("Content-Type", finalContentType);
              res.setHeader(
                "Content-Disposition",
                `${
                  inline ? "inline" : "attachment"
                }; filename="${sanitizedName}.${originalFormat}"`
              );
              if (contentLength) {
                res.setHeader("Content-Length", contentLength);
              }

              // Pipe the stream to the response
              stream.pipe(res);
              return;
            } catch (error: any) {
              console.error("Error fetching file from Spaces:", error);
              return res.status(500).json({
                error: "Failed to retrieve file from cloud storage",
                details: error.message,
              });
            }
          }
        }

        // If formats differ, we currently don't convert uploaded binary files
        return res.status(400).json({
          error: `Conversion unavailable. Original format is ${originalFormat.toUpperCase()}, requested ${requestedFormat.toUpperCase()}`,
        });
      }

      return res
        .status(400)
        .json({ error: "Document has no content or file to download" });
    }

    const fileName = document.name.replace(/[^a-z0-9]/gi, "_").toLowerCase();

    if (format.toLowerCase() === "pdf") {
      // Generate PDF
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `${inline ? "inline" : "attachment"}; filename="${fileName}.pdf"`
      );

      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      doc.pipe(res);

      // Convert HTML to formatted text
      const plainText = convert(content, {
        wordwrap: 100,
        preserveNewlines: true,
        selectors: [
          { selector: "h1", options: { uppercase: false } },
          { selector: "h2", options: { uppercase: false } },
          { selector: "ul", options: { itemPrefix: "• " } },
          { selector: "ol", options: { itemPrefix: "" } },
        ],
      });

      // Split content into lines and apply formatting
      const lines = plainText.split("\n");

      // IMPORTANT: iterate with explicit index to avoid relying on lines.indexOf(line),
      // which can return the wrong position when lines contain duplicate text and
      // cause us to mis-detect context near the bottom of the document.
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();
        if (!trimmedLine) {
          doc.moveDown(0.3);
          continue;
        }

        // Detect and format headings (from HTML h1, h2 tags)
        if (
          line.length < 100 &&
          !line.startsWith("•") &&
          !line.match(/^\d+\./)
        ) {
          // Check if it's a potential heading by looking at the *next* line in sequence
          const nextLineIndex = i + 1;
          const hasContentAfter =
            nextLineIndex < lines.length && lines[nextLineIndex].trim();

          if (
            hasContentAfter &&
            (line.toUpperCase() === line || line.length < 60)
          ) {
            // Heading
            doc.fontSize(14).fillColor("#000000").font("Helvetica-Bold");
            doc.text(trimmedLine, { align: "left", lineGap: 3 });
            doc.moveDown(0.5);
            doc.fontSize(11).font("Helvetica");
            continue;
          }
        }

        // Regular text
        doc.fontSize(11).fillColor("#000000").font("Helvetica");
        doc.text(trimmedLine, { align: "left", lineGap: 3 });
        doc.moveDown(0.3);
      }

      // Add footer with page numbers
      const range = doc.bufferedPageRange();
      for (let i = 0; i < range.count; i++) {
        doc.switchToPage(range.start + i);
        doc
          .fontSize(8)
          .fillColor("#999999")
          .text(`Page ${i + 1} of ${range.count}`, 50, doc.page.height - 30, {
            align: "center",
          });
      }

      doc.end();
    } else if (format.toLowerCase() === "docx") {
      // Generate DOCX
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      );
      res.setHeader(
        "Content-Disposition",
        `${inline ? "inline" : "attachment"}; filename="${fileName}.docx"`
      );

      // Convert HTML to plain text with formatting
      const plainText = convert(content, {
        wordwrap: 100,
        preserveNewlines: true,
        selectors: [
          { selector: "h1", options: { uppercase: false } },
          { selector: "h2", options: { uppercase: false } },
          { selector: "ul", options: { itemPrefix: "• " } },
          { selector: "ol", options: { itemPrefix: "" } },
        ],
      });

      // Parse HTML to extract formatting
      const parseHtmlToParagraphs = (htmlContent: string) => {
        const paragraphs: any[] = [];

        // Simple HTML tag detection
        const h1Regex = /<h1[^>]*>(.*?)<\/h1>/gi;
        const h2Regex = /<h2[^>]*>(.*?)<\/h2>/gi;
        const pRegex = /<p[^>]*>(.*?)<\/p>/gi;
        const strongRegex = /<strong[^>]*>(.*?)<\/strong>/gi;
        const emRegex = /<em[^>]*>(.*?)<\/em>/gi;
        const uRegex = /<u[^>]*>(.*?)<\/u>/gi;
        const ulRegex = /<ul[^>]*>(.*?)<\/ul>/gi;
        const olRegex = /<ol[^>]*>(.*?)<\/ol>/gi;
        const liRegex = /<li[^>]*>(.*?)<\/li>/gi;

        let match;
        let processedContent = htmlContent;

        // Extract headings and paragraphs
        const lines = plainText.split("\n");
        lines.forEach((line: string) => {
          const trimmedLine = line.trim();
          if (!trimmedLine) {
            return;
          }

          // Check if it's a heading based on HTML content
          const isH1 = htmlContent.match(
            new RegExp(
              `<h1[^>]*>${trimmedLine.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
              "i"
            )
          );
          const isH2 = htmlContent.match(
            new RegExp(
              `<h2[^>]*>${trimmedLine.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
              "i"
            )
          );

          if (isH1) {
            paragraphs.push(
              new Paragraph({
                text: trimmedLine,
                heading: HeadingLevel.HEADING_1,
                spacing: { after: 200 },
              })
            );
          } else if (isH2) {
            paragraphs.push(
              new Paragraph({
                text: trimmedLine,
                heading: HeadingLevel.HEADING_2,
                spacing: { after: 150 },
              })
            );
          } else {
            // Regular paragraph
            const textRuns: any[] = [];

            // Simple text run (this could be enhanced to handle inline formatting)
            textRuns.push(
              new TextRun({
                text: trimmedLine,
                size: 22, // 11pt
              })
            );

            paragraphs.push(
              new Paragraph({
                children: textRuns,
                spacing: { after: 150 },
              })
            );
          }
        });

        return paragraphs;
      };

      const docxParagraphs = parseHtmlToParagraphs(content);

      const docxDoc = new Document({
        sections: [
          {
            properties: {},
            children:
              docxParagraphs.length > 0
                ? docxParagraphs
                : [
                    new Paragraph({
                      text: plainText,
                      spacing: { after: 150 },
                    }),
                  ],
          },
        ],
      });

      const buffer = await Packer.toBuffer(docxDoc);
      res.send(buffer);
    }
  } catch (error: any) {
    console.error("Download document error:", error);
    return res.status(500).json({ error: "Failed to download document" });
  }
});

// Helper function to check document access
async function checkDocumentAccess(
  userId: string,
  role: string,
  document: any
): Promise<boolean> {
  if (role === "owner" || role === "property_owner") {
    // Check if user owns the property or the customer
    if (document.propertyId) {
      const property = await prisma.properties.findFirst({
        where: {
          id: document.propertyId,
          ownerId: userId,
        },
      });
      if (property) return true;
    }

    // If no propertyId or property not found, check if user owns any property with this customerId
    if (document.customerId) {
      const ownerProperty = await prisma.properties.findFirst({
        where: {
          customerId: document.customerId,
          ownerId: userId,
        },
      });
      return !!ownerProperty;
    }

    return false;
  } else if (role === "manager" || role === "property_manager") {
    // Manager can access documents they created or are assigned to
    // First check if they uploaded it or it's assigned to them
    if (document.uploadedById === userId || document.managerId === userId) {
      return true;
    }

    // Check if the document is shared with this manager
    if (
      document.isShared &&
      document.sharedWith &&
      Array.isArray(document.sharedWith) &&
      document.sharedWith.includes(userId)
    ) {
      console.log(
        "[Document Access] Manager has access via sharing:",
        userId,
        document.id
      );
      return true;
    }

    // Also check if they manage the property (for backward compatibility)
    if (document.propertyId) {
      const assignment = await prisma.property_managers.findFirst({
        where: {
          propertyId: document.propertyId,
          managerId: userId,
          isActive: true,
        },
      });
      if (assignment) {
        // Additional check: they must be the uploader or assigned manager
        return (
          document.uploadedById === userId || document.managerId === userId
        );
      }
    }
    return false;
  } else if (role === "tenant") {
    // Tenant can only access their own documents or shared documents
    return (
      document.tenantId === userId || document.sharedWith?.includes(userId)
    );
  }
  return false;
}

export default router;
