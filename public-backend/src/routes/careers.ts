import express, { Request, Response } from "express";
import { careerService } from "../services/career.service";
import multer from "multer";
import storageService from "../services/storage.service";

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow PDF, DOC, DOCX files
    const allowedMimes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only PDF, DOC, and DOCX files are allowed."
        )
      );
    }
  },
});

/**
 * GET /api/careers
 * Get public career postings (active only)
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const filters = {
      department: req.query.department as string,
      location: req.query.location as string,
      type: req.query.type as string,
      remote: req.query.remote as string,
      experience: req.query.experience as string,
      search: req.query.search as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
    };

    const result = await careerService.getPublicPostings(filters);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("❌ Get public careers error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch career postings",
      message: error.message,
    });
  }
});

/**
 * GET /api/careers/filters
 * Get available filter options for public
 */
router.get("/filters", async (req: Request, res: Response) => {
  try {
    const options = await careerService.getFilterOptions();

    return res.json({
      success: true,
      data: options,
    });
  } catch (error: any) {
    console.error("❌ Get filter options error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch filter options",
      message: error.message,
    });
  }
});

/**
 * GET /api/careers/stats
 * Get public career statistics
 */
router.get("/stats", async (req: Request, res: Response) => {
  try {
    const stats = await careerService.getPublicStatistics();

    return res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error("❌ Get career stats error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch statistics",
      message: error.message,
    });
  }
});

/**
 * GET /api/careers/:id
 * Get a single career posting (public)
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const posting = await careerService.getPostingById(id);

    if (!posting) {
      return res.status(404).json({
        success: false,
        error: "Career posting not found",
      });
    }

    return res.json({
      success: true,
      data: posting,
    });
  } catch (error: any) {
    console.error("❌ Get career posting error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch career posting",
      message: error.message,
    });
  }
});

/**
 * POST /api/careers/:id/apply
 * Submit a job application (public)
 * Supports both JSON (with resumeUrl/coverLetterUrl) and multipart/form-data (with file upload)
 */
router.post(
  "/:id/apply",
  (req: Request, res: Response, next) => {
    upload.fields([
      { name: "resume", maxCount: 1 },
      { name: "coverLetter", maxCount: 1 },
    ])(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        console.error("❌ Multer error:", err);
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            error: "File size too large",
            message: "Maximum file size is 10MB",
          });
        }
        return res.status(400).json({
          success: false,
          error: "File upload error",
          message: err.message,
        });
      } else if (err) {
        console.error("❌ File filter error:", err);
        return res.status(400).json({
          success: false,
          error: "File validation error",
          message: err.message || "Invalid file type",
        });
      }
      next();
    });
  },
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Handle file uploads - req.files can be undefined or have different structure
      let resumeFile: Express.Multer.File | undefined;
      let coverLetterFile: Express.Multer.File | undefined;

      if (req.files) {
        // Handle both single file and array of files
        const files = req.files as {
          [fieldname: string]: Express.Multer.File[];
        };
        if (
          files.resume &&
          Array.isArray(files.resume) &&
          files.resume.length > 0
        ) {
          resumeFile = files.resume[0];
        }
        if (
          files.coverLetter &&
          Array.isArray(files.coverLetter) &&
          files.coverLetter.length > 0
        ) {
          coverLetterFile = files.coverLetter[0];
        }
      }

      const {
        firstName,
        lastName,
        email,
        phone,
        coverLetter, // Text cover letter (for backward compatibility)
        linkedInUrl,
        portfolioUrl,
        resumeUrl, // For backward compatibility if file is uploaded separately
        coverLetterUrl, // For backward compatibility
      } = req.body;

      // Validation
      if (!firstName || !lastName || !email) {
        return res.status(400).json({
          success: false,
          error: "Validation error",
          message: "First name, last name, and email are required",
        });
      }

      // Check if posting exists and is active
      const posting = await careerService.getPostingById(id);
      if (!posting || posting.status !== "active") {
        return res.status(404).json({
          success: false,
          error: "Career posting not found or not accepting applications",
        });
      }

      // Get IP and user agent
      const ipAddress =
        req.ip ||
        req.socket.remoteAddress ||
        req.headers["x-forwarded-for"]?.toString() ||
        undefined;
      const userAgent = req.get("user-agent") || undefined;

      const prisma = (await import("../lib/db")).default;

      // Upload resume file if provided (before creating application)
      let finalResumeUrl: string | undefined = resumeUrl;
      if (resumeFile) {
        try {
          console.log("📤 Uploading resume file for application...");
          // Upload to temp location first, we'll update path after creating application
          const uploadResult = await storageService.uploadFile({
            file: {
              originalName: resumeFile.originalname,
              buffer: resumeFile.buffer,
              mimetype: resumeFile.mimetype,
              size: resumeFile.size,
            },
            category: "careers",
            fileType: "resume",
            // No applicationId yet - will be updated after creation
          });

          finalResumeUrl = uploadResult.filePath;
          console.log("✅ Resume uploaded to Spaces (temp):", finalResumeUrl);
        } catch (uploadError: any) {
          console.error("❌ Resume upload error:", uploadError);
          return res.status(500).json({
            success: false,
            error: "Failed to upload resume",
            message: uploadError.message || "Please try again later",
          });
        }
      }

      // Upload cover letter file if provided (before creating application)
      let finalCoverLetterUrl: string | undefined = coverLetterUrl;
      if (coverLetterFile) {
        try {
          console.log("📤 Uploading cover letter file for application...");
          // Upload to temp location first, we'll update path after creating application
          const uploadResult = await storageService.uploadFile({
            file: {
              originalName: coverLetterFile.originalname,
              buffer: coverLetterFile.buffer,
              mimetype: coverLetterFile.mimetype,
              size: coverLetterFile.size,
            },
            category: "careers",
            fileType: "coverLetter",
            // No applicationId yet - will be updated after creation
          });

          finalCoverLetterUrl = uploadResult.filePath;
          console.log(
            "✅ Cover letter uploaded to Spaces (temp):",
            finalCoverLetterUrl
          );
        } catch (uploadError: any) {
          console.error("❌ Cover letter upload error:", uploadError);
          return res.status(500).json({
            success: false,
            error: "Failed to upload cover letter",
            message: uploadError.message || "Please try again later",
          });
        }
      }

      // Create application
      const application = await prisma.career_applications.create({
        data: {
          postingId: id,
          firstName,
          lastName,
          email,
          phone: phone || undefined,
          coverLetter: coverLetter || undefined, // Text cover letter (backward compatibility)
          coverLetterUrl: finalCoverLetterUrl,
          linkedInUrl: linkedInUrl || undefined,
          portfolioUrl: portfolioUrl || undefined,
          resumeUrl: finalResumeUrl,
          ipAddress,
          userAgent,
          status: "pending",
        },
      });

      // If resume file was uploaded, move it to the application's directory
      if (resumeFile && finalResumeUrl) {
        const oldPath = finalResumeUrl; // Save old path before updating
        try {
          // Re-upload to correct location with application ID
          const reuploadResult = await storageService.uploadFile({
            file: {
              originalName: resumeFile.originalname,
              buffer: resumeFile.buffer,
              mimetype: resumeFile.mimetype,
              size: resumeFile.size,
            },
            category: "careers",
            fileType: "resume",
            applicationId: application.id,
          });

          // Update application with new path
          await prisma.career_applications.update({
            where: { id: application.id },
            data: { resumeUrl: reuploadResult.filePath },
          });

          finalResumeUrl = reuploadResult.filePath;

          // Delete old temp file (only if paths are different)
          if (oldPath !== reuploadResult.filePath) {
            await storageService.deleteFile(oldPath);
          }

          console.log(
            "✅ Resume moved to application directory:",
            reuploadResult.filePath
          );
        } catch (reuploadError: any) {
          console.error(
            "❌ Error moving resume to application folder:",
            reuploadError
          );
          // Continue with original path if move fails - file is still accessible
        }
      }

      // If cover letter file was uploaded, move it to the application's directory
      if (coverLetterFile && finalCoverLetterUrl) {
        const oldPath = finalCoverLetterUrl; // Save old path before updating
        try {
          // Re-upload to correct location with application ID
          const reuploadResult = await storageService.uploadFile({
            file: {
              originalName: coverLetterFile.originalname,
              buffer: coverLetterFile.buffer,
              mimetype: coverLetterFile.mimetype,
              size: coverLetterFile.size,
            },
            category: "careers",
            fileType: "coverLetter",
            applicationId: application.id,
          });

          // Update application with new path
          await prisma.career_applications.update({
            where: { id: application.id },
            data: { coverLetterUrl: reuploadResult.filePath },
          });

          finalCoverLetterUrl = reuploadResult.filePath;

          // Delete old temp file (only if paths are different)
          if (oldPath !== reuploadResult.filePath) {
            await storageService.deleteFile(oldPath);
          }

          console.log(
            "✅ Cover letter moved to application directory:",
            reuploadResult.filePath
          );
        } catch (reuploadError: any) {
          console.error(
            "❌ Error moving cover letter to application folder:",
            reuploadError
          );
          // Continue with original path if move fails - file is still accessible
        }
      }

      // Increment application count
      await prisma.career_postings.update({
        where: { id },
        data: { applicationCount: { increment: 1 } },
      });

      console.log("✅ Job application submitted:", application.id);

      return res.status(201).json({
        success: true,
        message: "Application submitted successfully",
        data: {
          id: application.id,
          status: application.status,
          submittedAt: application.createdAt,
          resumeUrl: finalResumeUrl,
          coverLetterUrl: finalCoverLetterUrl,
        },
      });
    } catch (error: any) {
      console.error("❌ Submit application error:", error);
      console.error("❌ Error stack:", error.stack);
      console.error("❌ Request body:", req.body);
      console.error("❌ Request files:", req.files);
      return res.status(500).json({
        success: false,
        error: "Failed to submit application",
        message: error.message || "Please try again later",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  }
);

export default router;
