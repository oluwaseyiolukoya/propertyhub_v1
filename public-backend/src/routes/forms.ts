import express, { Request, Response } from "express";
import { z } from "zod";
import prisma from "../lib/db";

const router = express.Router();

/**
 * Validation schema for form submission
 */
const submissionSchema = z.object({
  formType: z.enum([
    "contact",
    "contact_us", // Accept both formats
    "demo",
    "sales",
    "support",
    "schedule_demo",
  ]),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
  preferredDate: z.string().optional(),
  preferredTime: z.string().optional(),
  timezone: z.string().optional(),
  source: z.string().optional(),
  referralUrl: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  customFields: z.any().optional(), // Allow custom fields like inquiryType
});

/**
 * POST /api/forms/submit
 * Public endpoint to submit a form
 */
router.post("/submit", async (req: Request, res: Response) => {
  try {
    console.log("📥 Form submission received:", {
      formType: req.body.formType,
      name: req.body.name,
      email: req.body.email,
    });

    // Validate request body
    const validatedData = submissionSchema.parse(req.body);

    // Map formType to database format
    let dbFormType = validatedData.formType;
    if (validatedData.formType === "schedule_demo") {
      dbFormType = "demo";
    } else if (validatedData.formType === "contact_us") {
      dbFormType = "contact";
    }

    // Get IP and user agent
    const ipAddress =
      req.ip ||
      req.socket.remoteAddress ||
      req.headers["x-forwarded-for"]?.toString() ||
      undefined;
    const userAgent = req.get("user-agent") || undefined;

    // Parse preferredDate if provided
    let preferredDateParsed: Date | undefined;
    if (validatedData.preferredDate) {
      preferredDateParsed = new Date(validatedData.preferredDate);
      if (isNaN(preferredDateParsed.getTime())) {
        preferredDateParsed = undefined;
      }
    }

    // Create submission
    const submission = await prisma.contact_submissions.create({
      data: {
        formType: dbFormType,
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone,
        company: validatedData.company,
        jobTitle: validatedData.jobTitle,
        subject: validatedData.subject,
        message: validatedData.message,
        preferredDate: preferredDateParsed,
        preferredTime: validatedData.preferredTime,
        source: validatedData.source,
        referralUrl: validatedData.referralUrl,
        utmMedium: validatedData.utmMedium,
        utmCampaign: validatedData.utmCampaign,
        ipAddress,
        userAgent,
        metadata: {
          timezone: validatedData.timezone,
          utmSource: validatedData.utmSource,
          originalFormType: validatedData.formType, // Store original for reference
          customFields: validatedData.customFields || {}, // Store custom fields like inquiryType
        },
        status: "new",
        priority: "normal",
      },
    });

    console.log("✅ Form submitted successfully:", submission.id);

    return res.status(201).json({
      success: true,
      message: "Form submitted successfully",
      data: {
        id: submission.id,
        status: submission.status,
        submittedAt: submission.createdAt,
      },
    });
  } catch (error: any) {
    console.error("❌ Form submission error:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Validation error",
        message: error.errors
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", "),
        details: error.errors,
      });
    }

    return res.status(500).json({
      success: false,
      error: "Failed to submit form",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Please try again later",
    });
  }
});

export default router;
