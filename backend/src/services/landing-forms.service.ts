import prisma from "../lib/db";
import { randomUUID } from "crypto";
import { sendContactFormConfirmation } from "../lib/email";

export interface SubmissionData {
  formType:
    | "contact_us"
    | "schedule_demo"
    | "blog_inquiry"
    | "community_request"
    | "partnership"
    | "support";
  name: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  subject?: string;
  message: string;
  preferredDate?: Date;
  preferredTime?: string;
  timezone?: string;
  source?: string;
  referralUrl?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  customFields?: any;
}

export interface FilterOptions {
  formType?: string;
  status?: string;
  priority?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  assignedToId?: string;
  page?: number;
  limit?: number;
  showArchived?: boolean;
}

export interface UpdateData {
  status?: string;
  priority?: string;
  adminNotes?: string;
  assignedToId?: string;
  responseStatus?: string;
  internalTags?: string[];
}

export interface ResponseData {
  responseType: "email" | "phone" | "meeting" | "internal_note";
  content: string;
  respondedById: string;
  attachments?: any;
}

export class LandingFormsService {
  // Rate limiting map (in production, use Redis)
  private submissionAttempts = new Map<
    string,
    { count: number; resetAt: number }
  >();

  /**
   * Check rate limit for IP address
   */
  private checkRateLimit(ipAddress: string): boolean {
    const now = Date.now();
    const windowMs = 24 * 60 * 60 * 1000; // 24 hours
    const maxAttempts = 5;

    const attempts = this.submissionAttempts.get(ipAddress);

    if (attempts) {
      if (now < attempts.resetAt) {
        if (attempts.count >= maxAttempts) {
          return false; // Rate limited
        }
        attempts.count++;
      } else {
        this.submissionAttempts.set(ipAddress, {
          count: 1,
          resetAt: now + windowMs,
        });
      }
    } else {
      this.submissionAttempts.set(ipAddress, {
        count: 1,
        resetAt: now + windowMs,
      });
    }

    return true; // Not rate limited
  }

  /**
   * Basic spam detection
   */
  private async detectSpam(data: SubmissionData): Promise<boolean> {
    // Check for common spam patterns
    const spamKeywords = ["viagra", "casino", "lottery", "bitcoin", "crypto"];
    const messageText = (
      data.message +
      " " +
      (data.subject || "")
    ).toLowerCase();

    for (const keyword of spamKeywords) {
      if (messageText.includes(keyword)) {
        return true;
      }
    }

    // Check for suspicious email domains
    const suspiciousDomains = [
      "temp-mail.org",
      "throwaway.email",
      "guerrillamail.com",
    ];
    const emailDomain = data.email.split("@")[1];
    if (suspiciousDomains.includes(emailDomain)) {
      return true;
    }

    // Check for duplicate submissions in last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentSubmission = await prisma.landing_page_submissions.findFirst({
      where: {
        email: data.email,
        message: data.message,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (recentSubmission) {
      return true; // Duplicate submission
    }

    return false;
  }

  /**
   * Submit a new form
   */
  async submitForm(
    data: SubmissionData,
    ipAddress?: string,
    userAgent?: string
  ): Promise<any> {
    // Rate limiting check
    if (ipAddress && !this.checkRateLimit(ipAddress)) {
      throw new Error("Too many submissions. Please try again tomorrow.");
    }

    // Spam detection
    const isSpam = await this.detectSpam(data);

    const submission = await prisma.landing_page_submissions.create({
      data: {
        id: randomUUID(),
        formType: data.formType,
        name: data.name,
        email: data.email,
        phone: data.phone,
        company: data.company,
        jobTitle: data.jobTitle,
        subject: data.subject,
        message: data.message,
        preferredDate: data.preferredDate,
        preferredTime: data.preferredTime,
        timezone: data.timezone,
        source: data.source,
        referralUrl: data.referralUrl,
        utmSource: data.utmSource,
        utmMedium: data.utmMedium,
        utmCampaign: data.utmCampaign,
        customFields: data.customFields,
        ipAddress,
        userAgent,
        status: isSpam ? "spam" : "new",
        priority: "normal",
        internalTags: [],
        updatedAt: new Date(),
      },
    });

    // Send confirmation email to user if not spam
    if (!isSpam) {
      console.log(`📧 Sending confirmation email to ${submission.email}...`);
      console.log(`🎫 Ticket ID (for admin use): ${submission.id}`);
      try {
        await sendContactFormConfirmation({
          to: submission.email,
          name: submission.name,
          submissionId: submission.id, // Ticket ID - only visible to admins
          formType: submission.formType,
          subject: submission.subject || undefined,
          message: submission.message,
        });
        console.log(
          `✅ Confirmation email sent successfully to ${submission.email}`
        );
      } catch (emailError) {
        console.error("❌ Failed to send confirmation email:", emailError);
        // Don't fail the submission if email fails
      }

      // Send notification to admins
      await this.notifyAdmins(submission);
    }

    return submission;
  }

  /**
   * Get submissions with filters and pagination
   */
  async getSubmissions(filters: FilterOptions = {}): Promise<any> {
    const {
      formType,
      status,
      priority,
      search,
      dateFrom,
      dateTo,
      assignedToId,
      page = 1,
      limit = 20,
      showArchived = false,
    } = filters;

    const where: any = {};

    // Show archived or active based on filter
    if (showArchived) {
      where.deletedAt = { not: null }; // Show only archived (deletedAt is NOT null)
    } else {
      where.deletedAt = null; // Show only active (deletedAt IS null)
    }

    if (formType && formType !== "all") {
      where.formType = formType;
    }

    if (status && status !== "all") {
      where.status = status;
    }

    if (priority && priority !== "all") {
      where.priority = priority;
    }

    if (assignedToId) {
      where.assignedToId = assignedToId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
        { message: { contains: search, mode: "insensitive" } },
      ];
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    const [submissions, total] = await Promise.all([
      prisma.landing_page_submissions.findMany({
        where,
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          responder: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.landing_page_submissions.count({ where }),
    ]);

    return {
      submissions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single submission by ID
   */
  async getSubmissionById(id: string): Promise<any> {
    const submission = await prisma.landing_page_submissions.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        responder: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        responses: {
          include: {
            respondedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!submission) {
      throw new Error("Submission not found");
    }

    return submission;
  }

  /**
   * Update submission
   */
  async updateSubmission(id: string, updates: UpdateData): Promise<any> {
    const updateData: any = { ...updates, updatedAt: new Date() };

    // Set timestamps based on status changes
    if (updates.status === "contacted" && !updateData.contactedAt) {
      updateData.contactedAt = new Date();
    }
    if (updates.status === "resolved" && !updateData.resolvedAt) {
      updateData.resolvedAt = new Date();
    }

    // Check if submission is archived and unarchive it if being updated
    const existingSubmission = await prisma.landing_page_submissions.findUnique(
      {
        where: { id },
        select: { deletedAt: true },
      }
    );

    if (existingSubmission?.deletedAt) {
      // Unarchive the submission by clearing deletedAt
      updateData.deletedAt = null;
    }

    const submission = await prisma.landing_page_submissions.update({
      where: { id },
      data: updateData,
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return submission;
  }

  /**
   * Soft delete submission (Archive)
   */
  async deleteSubmission(id: string): Promise<void> {
    await prisma.landing_page_submissions.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Permanently delete submission (Hard delete)
   */
  async permanentDeleteSubmission(id: string): Promise<void> {
    // First delete all related responses
    await prisma.submission_responses.deleteMany({
      where: { submissionId: id },
    });

    // Then delete the submission itself
    await prisma.landing_page_submissions.delete({
      where: { id },
    });
  }

  /**
   * Add response to submission
   */
  async addResponse(id: string, response: ResponseData): Promise<any> {
    const newResponse = await prisma.submission_responses.create({
      data: {
        id: randomUUID(),
        submissionId: id,
        responseType: response.responseType,
        content: response.content,
        respondedById: response.respondedById,
        attachments: response.attachments,
      },
      include: {
        respondedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Update submission response tracking
    await prisma.landing_page_submissions.update({
      where: { id },
      data: {
        responseStatus: "replied",
        responseDate: new Date(),
        responseBy: response.respondedById,
        updatedAt: new Date(),
      },
    });

    return newResponse;
  }

  /**
   * Assign submission to admin
   */
  async assignSubmission(id: string, adminId: string): Promise<any> {
    const submission = await prisma.landing_page_submissions.update({
      where: { id },
      data: {
        assignedToId: adminId,
        updatedAt: new Date(),
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return submission;
  }

  /**
   * Get statistics
   */
  async getStatistics(dateFrom?: Date, dateTo?: Date): Promise<any> {
    try {
      const where: any = { deletedAt: null };

      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = dateFrom;
        if (dateTo) where.createdAt.lte = dateTo;
      }

      const [total, byType, byStatus, byPriority, avgResponseTime] =
        await Promise.all([
          // Total submissions
          prisma.landing_page_submissions.count({ where }).catch((e) => {
            console.error("Error counting total submissions:", e);
            return 0;
          }),

          // By form type
          prisma.landing_page_submissions
            .groupBy({
              by: ["formType"],
              where,
              _count: true,
            })
            .catch((e) => {
              console.error("Error grouping by formType:", e);
              return [];
            }),

          // By status
          prisma.landing_page_submissions
            .groupBy({
              by: ["status"],
              where,
              _count: true,
            })
            .catch((e) => {
              console.error("Error grouping by status:", e);
              return [];
            }),

          // By priority
          prisma.landing_page_submissions
            .groupBy({
              by: ["priority"],
              where,
              _count: true,
            })
            .catch((e) => {
              console.error("Error grouping by priority:", e);
              return [];
            }),

          // Average response time (for resolved items)
          prisma.landing_page_submissions
            .findMany({
              where: {
                ...where,
                resolvedAt: { not: null },
                createdAt: { not: null },
              },
              select: {
                createdAt: true,
                resolvedAt: true,
              },
            })
            .catch((e) => {
              console.error("Error finding resolved submissions:", e);
              return [];
            }),
        ]);

      // Calculate average response time in hours
      let totalResponseTime = 0;
      if (Array.isArray(avgResponseTime)) {
        avgResponseTime.forEach((item) => {
          if (item?.resolvedAt && item?.createdAt) {
            const diff = item.resolvedAt.getTime() - item.createdAt.getTime();
            totalResponseTime += diff;
          }
        });
      }

      const avgHours =
        Array.isArray(avgResponseTime) && avgResponseTime.length > 0
          ? totalResponseTime / avgResponseTime.length / (1000 * 60 * 60)
          : 0;

      return {
        total: total || 0,
        byType: Array.isArray(byType)
          ? byType.reduce((acc: any, curr: any) => {
              acc[curr.formType] = curr._count;
              return acc;
            }, {})
          : {},
        byStatus: Array.isArray(byStatus)
          ? byStatus.reduce((acc: any, curr: any) => {
              acc[curr.status] = curr._count;
              return acc;
            }, {})
          : {},
        byPriority: Array.isArray(byPriority)
          ? byPriority.reduce((acc: any, curr: any) => {
              acc[curr.priority] = curr._count;
              return acc;
            }, {})
          : {},
        avgResponseTimeHours: Math.round(avgHours * 10) / 10,
      };
    } catch (error: any) {
      console.error("❌ getStatistics error:", error);
      throw new Error(`Failed to fetch statistics: ${error.message}`);
    }
  }

  /**
   * Bulk action on submissions
   */
  async bulkAction(ids: string[], action: string, value?: any): Promise<any> {
    switch (action) {
      case "mark_as_read":
        return await prisma.landing_page_submissions.updateMany({
          where: { id: { in: ids } },
          data: {
            status: "contacted",
            contactedAt: new Date(),
            updatedAt: new Date(),
          },
        });

      case "assign":
        return await prisma.landing_page_submissions.updateMany({
          where: { id: { in: ids } },
          data: { assignedToId: value, updatedAt: new Date() },
        });

      case "change_status":
        return await prisma.landing_page_submissions.updateMany({
          where: { id: { in: ids } },
          data: { status: value, updatedAt: new Date() },
        });

      case "change_priority":
        return await prisma.landing_page_submissions.updateMany({
          where: { id: { in: ids } },
          data: { priority: value, updatedAt: new Date() },
        });

      case "delete":
        return await prisma.landing_page_submissions.updateMany({
          where: { id: { in: ids } },
          data: { deletedAt: new Date(), updatedAt: new Date() },
        });

      default:
        throw new Error("Invalid bulk action");
    }
  }

  /**
   * Export submissions to CSV
   */
  async exportSubmissions(filters: FilterOptions = {}): Promise<string> {
    const { submissions } = await this.getSubmissions({
      ...filters,
      limit: 10000,
    });

    // CSV header
    const headers = [
      "ID",
      "Form Type",
      "Name",
      "Email",
      "Phone",
      "Company",
      "Subject",
      "Message",
      "Status",
      "Priority",
      "Assigned To",
      "Created At",
      "Contacted At",
      "Resolved At",
    ];

    // CSV rows
    const rows = submissions.map((sub: any) => [
      sub.id,
      sub.formType,
      sub.name,
      sub.email,
      sub.phone || "",
      sub.company || "",
      sub.subject || "",
      sub.message.replace(/\n/g, " ").replace(/"/g, '""'),
      sub.status,
      sub.priority,
      sub.assignedTo?.name || "",
      sub.createdAt.toISOString(),
      sub.contactedAt?.toISOString() || "",
      sub.resolvedAt?.toISOString() || "",
    ]);

    // Build CSV
    const csv = [
      headers.join(","),
      ...rows.map((row: any[]) =>
        row.map((cell: any) => `"${cell}"`).join(",")
      ),
    ].join("\n");

    return csv;
  }

  /**
   * Send notification to admins (placeholder)
   */
  private async notifyAdmins(submission: any): Promise<void> {
    // TODO: Implement email notification
    console.log(
      `📧 New ${submission.formType} submission from ${submission.email}`
    );
  }
}

export const landingFormsService = new LandingFormsService();
