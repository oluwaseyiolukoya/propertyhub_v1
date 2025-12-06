/**
 * Report Schedules Routes
 *
 * Handles CRUD operations for scheduled reports and sending scheduled report emails
 */

import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { sendEmail } from "../lib/email";

const router = Router();
const prisma = new PrismaClient();

// Type definitions
type ReportType = "financial" | "occupancy" | "maintenance" | "tenant" | "all";
type ScheduleFrequency = "weekly" | "monthly";
type ScheduleStatus = "active" | "paused";

interface ReportFilters {
  propertyId?: string;
  startDate?: string;
  endDate?: string;
  [key: string]: any;
}

interface CreateScheduleRequest {
  name: string;
  reportType: ReportType;
  propertyId?: string;
  frequency: ScheduleFrequency;
  dayOfWeek?: string;
  dayOfMonth?: number;
  time: string;
  email: string;
  filters?: ReportFilters;
}

interface UpdateScheduleRequest {
  name?: string;
  frequency?: ScheduleFrequency;
  dayOfWeek?: string;
  dayOfMonth?: number;
  time?: string;
  email?: string;
  status?: ScheduleStatus;
  filters?: ReportFilters;
}

// Helper function to calculate next run date
function calculateNextRun(
  frequency: ScheduleFrequency,
  time: string,
  dayOfWeek?: string,
  dayOfMonth?: number
): Date {
  const now = new Date();
  const [hours, minutes] = time.split(":").map(Number);

  const nextRun = new Date();
  nextRun.setHours(hours, minutes, 0, 0);

  if (frequency === "weekly") {
    const daysOfWeek = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const targetDay = daysOfWeek.indexOf(dayOfWeek?.toLowerCase() || "monday");
    const currentDay = nextRun.getDay();

    let daysUntilTarget = targetDay - currentDay;
    if (daysUntilTarget <= 0 || (daysUntilTarget === 0 && nextRun <= now)) {
      daysUntilTarget += 7;
    }

    nextRun.setDate(nextRun.getDate() + daysUntilTarget);
  } else if (frequency === "monthly") {
    const targetDay = dayOfMonth || 1;
    nextRun.setDate(targetDay);

    if (nextRun <= now) {
      nextRun.setMonth(nextRun.getMonth() + 1);
    }
  }

  return nextRun;
}

// GET /api/report-schedules - List all schedules for the authenticated user
router.get("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const customerId = req.user?.customerId;

    if (!userId || !customerId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const schedules = await prisma.report_schedules.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ success: true, data: schedules });
  } catch (error: any) {
    console.error("Failed to fetch report schedules:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/report-schedules - Create a new schedule
router.post("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const customerId = req.user?.customerId;

    if (!userId || !customerId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const {
      name,
      reportType,
      propertyId,
      frequency,
      dayOfWeek,
      dayOfMonth,
      time,
      email,
      filters,
    } = req.body as CreateScheduleRequest;

    // Validation
    if (!name || !reportType || !frequency || !time || !email) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (frequency === "weekly" && !dayOfWeek) {
      return res
        .status(400)
        .json({ error: "dayOfWeek is required for weekly schedules" });
    }

    if (frequency === "monthly" && !dayOfMonth) {
      return res
        .status(400)
        .json({ error: "dayOfMonth is required for monthly schedules" });
    }

    // Calculate next run date
    const nextRun = calculateNextRun(frequency, time, dayOfWeek, dayOfMonth);

    // Create schedule
    const schedule = await prisma.report_schedules.create({
      data: {
        customerId,
        userId,
        name,
        reportType,
        propertyId: propertyId || null,
        frequency,
        dayOfWeek: dayOfWeek || null,
        dayOfMonth: dayOfMonth || null,
        time,
        email,
        status: "active",
        filters: filters || null,
        nextRun,
      },
    });

    return res.json({ success: true, data: schedule });
  } catch (error: any) {
    console.error("Failed to create report schedule:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/report-schedules/:id - Get a specific schedule
router.get("/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const customerId = req.user?.customerId;
    const { id } = req.params;

    if (!userId || !customerId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const schedule = await prisma.report_schedules.findFirst({
      where: { id, customerId },
    });

    if (!schedule) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    return res.json({ success: true, data: schedule });
  } catch (error: any) {
    console.error("Failed to fetch report schedule:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/report-schedules/:id - Update a schedule
router.patch(
  "/:id",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const customerId = req.user?.customerId;
      const { id } = req.params;

      if (!userId || !customerId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const schedule = await prisma.report_schedules.findFirst({
        where: { id, customerId },
      });

      if (!schedule) {
        return res.status(404).json({ error: "Schedule not found" });
      }

      const updates = req.body as UpdateScheduleRequest;

      // Recalculate nextRun if frequency or time changed
      let nextRun = schedule.nextRun;
      if (
        updates.frequency ||
        updates.time ||
        updates.dayOfWeek ||
        updates.dayOfMonth
      ) {
        const frequency = updates.frequency || schedule.frequency;
        const time = updates.time || schedule.time;
        const dayOfWeek = updates.dayOfWeek || schedule.dayOfWeek || undefined;
        const dayOfMonth =
          updates.dayOfMonth || schedule.dayOfMonth || undefined;

        nextRun = calculateNextRun(
          frequency as ScheduleFrequency,
          time,
          dayOfWeek,
          dayOfMonth
        );
      }

      const updatedSchedule = await prisma.report_schedules.update({
        where: { id },
        data: {
          ...updates,
          nextRun,
          updatedAt: new Date(),
        },
      });

      return res.json({ success: true, data: updatedSchedule });
    } catch (error: any) {
      console.error("Failed to update report schedule:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// DELETE /api/report-schedules/:id - Delete a schedule
router.delete(
  "/:id",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const customerId = req.user?.customerId;
      const { id } = req.params;

      if (!userId || !customerId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const schedule = await prisma.report_schedules.findFirst({
        where: { id, customerId },
      });

      if (!schedule) {
        return res.status(404).json({ error: "Schedule not found" });
      }

      await prisma.report_schedules.delete({
        where: { id },
      });

      return res.json({ success: true, message: "Schedule deleted" });
    } catch (error: any) {
      console.error("Failed to delete report schedule:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// POST /api/report-schedules/:id/send - Send a scheduled report immediately (test)
router.post(
  "/:id/send",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const customerId = req.user?.customerId;
      const { id } = req.params;

      if (!userId || !customerId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const schedule = await prisma.report_schedules.findFirst({
        where: { id, customerId },
      });

      if (!schedule) {
        return res.status(404).json({ error: "Schedule not found" });
      }

      // Get property name if specified
      let propertyLabel = "All Properties";
      if (schedule.propertyId) {
        const property = await prisma.properties.findUnique({
          where: { id: schedule.propertyId },
          select: { name: true },
        });
        propertyLabel = property?.name || "Selected Property";
      }

      // Report type labels
      const reportLabelMap: Record<string, string> = {
        financial: "Financial",
        occupancy: "Occupancy",
        maintenance: "Maintenance",
        tenant: "Tenant",
        all: "Portfolio",
      };

      const reportLabel = reportLabelMap[schedule.reportType] || "Report";
      const generatedAt = new Date().toLocaleString();

      // Build email content
      const subjectLine = `Scheduled ${reportLabel} Report - ${propertyLabel}`;

      const filters = schedule.filters as ReportFilters | null;
      const dateRange =
        filters?.startDate || filters?.endDate
          ? `${filters.startDate || "—"} → ${filters.endDate || "—"}`
          : "Not specified";

      // Get report icon based on type
      const reportIcons: Record<string, string> = {
        financial: "💰",
        occupancy: "📊",
        maintenance: "🔧",
        tenant: "👥",
        all: "📈",
      };
      const reportIcon = reportIcons[schedule.reportType] || "📄";

      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${reportLabel} Report - ${propertyLabel}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
    .header p { margin: 10px 0 0; opacity: 0.9; font-size: 16px; }
    .content { background-color: #ffffff; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .report-info { background-color: #f8f9fa; border-left: 4px solid #7C3AED; padding: 20px; margin: 0 0 30px; border-radius: 4px; }
    .info-item { margin: 12px 0; }
    .info-label { font-weight: 600; color: #666666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-value { color: #333333; font-size: 16px; margin-top: 4px; }
    .schedule-details { background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 4px; }
    .schedule-details h3 { margin-top: 0; color: #065f46; font-size: 18px; font-weight: 600; }
    .feature { display: flex; align-items: center; gap: 8px; color: #374151; font-size: 14px; margin: 8px 0; }
    .feature-icon { color: #10b981; }
    .button { display: inline-block; background: linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%); color: white !important; padding: 14px 35px; text-decoration: none; border-radius: 6px; margin: 10px 0; font-weight: bold; }
    .button:hover { opacity: 0.9; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; background-color: #f9fafb; border-radius: 0 0 10px 10px; }
    .badge { display: inline-block; background: linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%); color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${reportIcon} ${reportLabel} Report</h1>
      <p>Scheduled Report Delivery</p>
    </div>
    <div class="content">
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
        Your scheduled <strong>${reportLabel}</strong> report is ready for review.
      </p>

      <div class="report-info">
        <h2 style="color: #7C3AED; margin: 0 0 15px; font-size: 18px; font-weight: 600;">📋 Report Details</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666666; font-size: 14px; width: 40%;">Schedule Name:</td>
            <td style="padding: 8px 0; color: #333333; font-size: 14px; font-weight: 500;">${
              schedule.name
            }</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666666; font-size: 14px;">Report Type:</td>
            <td style="padding: 8px 0;"><span class="badge">${reportLabel}</span></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666666; font-size: 14px;">Property:</td>
            <td style="padding: 8px 0; color: #333333; font-size: 14px; font-weight: 500;">${propertyLabel}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666666; font-size: 14px;">Date Range:</td>
            <td style="padding: 8px 0; color: #333333; font-size: 14px; font-weight: 500;">${dateRange}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666666; font-size: 14px;">Generated:</td>
            <td style="padding: 8px 0; color: #333333; font-size: 14px; font-weight: 500;">${generatedAt}</td>
          </tr>
        </table>
      </div>

      <div class="schedule-details">
        <h3>🔔 Delivery Schedule</h3>
        <p style="margin: 0 0 10px; color: #065f46;">This report will be automatically delivered to your inbox:</p>
        <div class="feature">
          <span class="feature-icon">✓</span>
          <span><strong>Frequency:</strong> ${
            schedule.frequency.charAt(0).toUpperCase() +
            schedule.frequency.slice(1)
          }</span>
        </div>
        <div class="feature">
          <span class="feature-icon">✓</span>
          <span><strong>Delivery Time:</strong> ${schedule.time}</span>
        </div>
        ${
          schedule.dayOfWeek
            ? `
        <div class="feature">
          <span class="feature-icon">✓</span>
          <span><strong>Day:</strong> ${
            schedule.dayOfWeek.charAt(0).toUpperCase() +
            schedule.dayOfWeek.slice(1)
          }</span>
        </div>
        `
            : ""
        }
        ${
          schedule.dayOfMonth
            ? `
        <div class="feature">
          <span class="feature-icon">✓</span>
          <span><strong>Day of Month:</strong> ${schedule.dayOfMonth}</span>
        </div>
        `
            : ""
        }
      </div>

      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
        <strong>📧 Test Email</strong><br>
        <span style="color: #92400e;">This is a test email to verify your scheduled report delivery. Future reports will include detailed data and analytics.</span>
      </div>

      <center>
        <p style="color: #333333; margin: 30px 0 10px;">Need to make changes to your schedule?</p>
        <a href="${
          process.env.FRONTEND_URL || "https://app.contrezz.com"
        }" class="button">📊 Manage Schedules</a>
      </center>

      <p style="margin-top: 30px; color: #333333; font-size: 14px;">
        If you have any questions or need assistance, please contact support.
      </p>

      <p style="color: #333333;">Best regards,<br>
      <strong>Contrezz Platform Team</strong><br>
      Property Management System</p>
    </div>
    <div class="footer">
      <p>This is an automated email from Contrezz Property Management Platform.</p>
      <p>You are receiving this because you have scheduled this report.</p>
      <p style="margin-top: 10px;">
        <a href="${
          process.env.FRONTEND_URL || "https://app.contrezz.com"
        }" style="color: #7C3AED; text-decoration: none;">Manage Your Reports</a>
      </p>
    </div>
  </div>
</body>
</html>
      `.trim();

      const text = `
${reportIcon} ${reportLabel} Report - ${propertyLabel}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your scheduled ${reportLabel} report is ready for review.

📋 REPORT DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Schedule Name:  ${schedule.name}
Report Type:    ${reportLabel}
Property:       ${propertyLabel}
Date Range:     ${dateRange}
Generated:      ${generatedAt}

🔔 DELIVERY SCHEDULE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Frequency: ${
        schedule.frequency.charAt(0).toUpperCase() + schedule.frequency.slice(1)
      }
✓ Delivery Time: ${schedule.time}
${
  schedule.dayOfWeek
    ? `✓ Day: ${
        schedule.dayOfWeek.charAt(0).toUpperCase() + schedule.dayOfWeek.slice(1)
      }\n`
    : ""
}${schedule.dayOfMonth ? `✓ Day of Month: ${schedule.dayOfMonth}\n` : ""}
📧 TEST EMAIL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This is a test email to verify your scheduled report delivery.
Future reports will include detailed data and analytics.

Need to make changes? Visit: ${
        process.env.FRONTEND_URL || "https://app.contrezz.com"
      }

If you have any questions, please contact support.

Best regards,
Contrezz Platform Team
Property Management System

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This is an automated email from Contrezz Property Management Platform.
You are receiving this because you have scheduled this report.
      `.trim();

      // Send email using the sendEmail utility
      try {
        const { sendEmail } = await import("../lib/email");

        const emailSent = await sendEmail({
          to: schedule.email.trim(),
          subject: subjectLine,
          html,
          text,
        });

        if (!emailSent) {
          console.error("Failed to send scheduled report email");
          return res.status(500).json({
            error: "Failed to send report email",
            details: "Email service returned false",
          });
        }

        console.log(`✅ Scheduled report email sent to ${schedule.email}`);
      } catch (emailError: any) {
        console.error("Failed to send scheduled report email:", emailError);
        return res.status(500).json({
          error: "Failed to send report email",
          details: emailError.message,
        });
      }

      // Update lastRun
      await prisma.report_schedules.update({
        where: { id },
        data: { lastRun: new Date() },
      });

      return res.json({
        success: true,
        message: "Report email sent successfully",
        emailSent: true,
      });
    } catch (error: any) {
      console.error("Failed to send scheduled report:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
