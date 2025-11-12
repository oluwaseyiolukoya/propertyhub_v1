import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { calculateTrialEndDateFrom } from '../lib/trial-config';
import {
  ApplicationInput,
  ApproveApplicationInput,
  RejectApplicationInput,
  RequestInfoInput,
  ReviewApplicationInput,
  ApplicationFilters,
} from '../validators/onboarding.validator';
import {
  ApplicationStatus,
  ApplicationWithRelations,
  PaginatedApplications,
  ApplicationStats,
  ApprovalResult,
  ActivationResult,
  ApplicationTimeline,
} from '../types/onboarding.types';

const prisma = new PrismaClient();

export class OnboardingService {
  /**
   * Submit a new application
   */
  async submitApplication(
    data: ApplicationInput,
    ipAddress?: string,
    userAgent?: string
  ): Promise<ApplicationWithRelations> {
    // Check if email already exists in applications
    const existingApplication = await prisma.onboarding_applications.findUnique({
      where: { email: data.email },
    });

    if (existingApplication) {
      // Check if they can reapply (rejected more than 30 days ago)
      if (existingApplication.status === 'rejected') {
        const daysSinceRejection = existingApplication.updatedAt
          ? Math.floor(
              (Date.now() - existingApplication.updatedAt.getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : 0;

        if (daysSinceRejection < 30) {
          throw new Error(
            `You can reapply ${30 - daysSinceRejection} days after rejection`
          );
        }
      } else if (existingApplication.status !== 'rejected') {
        throw new Error('An application with this email already exists');
      }
    }

    // Check if email exists in customers
    const existingCustomer = await prisma.customers.findUnique({
      where: { email: data.email },
    });

    if (existingCustomer) {
      throw new Error('An account with this email already exists');
    }

    // Create the application
    const application = await prisma.onboarding_applications.create({
      data: {
        id: uuidv4(),
        ...data,
        ipAddress,
        userAgent,
        status: 'pending',
      },
      include: {
        reviewer: true,
        approver: true,
        activator: true,
        customer: true,
        plan: true,
      },
    });

    return application as ApplicationWithRelations;
  }

  /**
   * Get application by ID
   */
  async getApplicationById(id: string): Promise<ApplicationWithRelations | null> {
    const application = await prisma.onboarding_applications.findUnique({
      where: { id },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        approver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        activator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        customer: {
          select: {
            id: true,
            company: true,
            email: true,
            status: true,
          },
        },
        plan: {
          select: {
            id: true,
            name: true,
            monthlyPrice: true,
            annualPrice: true,
          },
        },
      },
    });

    if (!application) {
      return null;
    }

    // Build timeline
    const timeline = this.buildTimeline(application);

    return {
      ...application,
      timeline,
    } as ApplicationWithRelations;
  }

  /**
   * Get application by email
   */
  async getApplicationByEmail(email: string): Promise<ApplicationWithRelations | null> {
    const application = await prisma.onboarding_applications.findUnique({
      where: { email },
      include: {
        reviewer: true,
        approver: true,
        activator: true,
        customer: true,
        plan: true,
      },
    });

    return application as ApplicationWithRelations | null;
  }

  /**
   * List applications with filters and pagination
   */
  async listApplications(filters: ApplicationFilters): Promise<PaginatedApplications> {
    const { status, applicationType, page, limit, sortBy, sortOrder, search } = filters;

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (applicationType) {
      where.applicationType = applicationType;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await prisma.onboarding_applications.count({ where });

    // Get applications
    const applications = await prisma.onboarding_applications.findMany({
      where,
      include: {
        reviewer: {
          select: { id: true, name: true, email: true },
        },
        approver: {
          select: { id: true, name: true, email: true },
        },
        activator: {
          select: { id: true, name: true, email: true },
        },
        customer: {
          select: { id: true, company: true, email: true, status: true },
        },
        plan: {
          select: { id: true, name: true, monthlyPrice: true, annualPrice: true },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Get stats
    const stats = await this.getStats();

    return {
      applications: applications as ApplicationWithRelations[],
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      stats,
    };
  }

  /**
   * Update review status
   */
  async updateReview(
    id: string,
    adminId: string,
    data: ReviewApplicationInput
  ): Promise<ApplicationWithRelations> {
    const application = await prisma.onboarding_applications.update({
      where: { id },
      data: {
        ...data,
        ...(adminId ? { reviewedBy: adminId } : {}),
        reviewedAt: new Date(),
        status: data.reviewStatus === 'in_progress' ? 'under_review' : undefined,
      },
      include: {
        reviewer: true,
        approver: true,
        activator: true,
        customer: true,
        plan: true,
      },
    });

    return application as ApplicationWithRelations;
  }

  /**
   * Approve application and create customer
   */
  async approveApplication(
    id: string,
    adminId: string,
    data: ApproveApplicationInput
  ): Promise<ApprovalResult> {
    const application = await prisma.onboarding_applications.findUnique({
      where: { id },
    });

    if (!application) {
      throw new Error('Application not found');
    }

    if (application.status === 'approved' || application.status === 'activated') {
      throw new Error('Application already approved');
    }

    // Calculate trial dates
    const now = new Date();
    // Get trial duration from Trial plan configuration
    const trialEndsAt = await calculateTrialEndDateFrom(now);

    // If a customer with this email already exists, reuse and update it; otherwise create new
    const existingCustomer = await prisma.customers.findUnique({
      where: { email: application.email },
    });

    let customerId = existingCustomer?.id ?? uuidv4();
    let customer;
    if (existingCustomer) {
      customer = await prisma.customers.update({
        where: { id: existingCustomer.id },
        data: {
          company: existingCustomer.company || application.companyName || application.name,
          owner: existingCustomer.owner || application.name,
          phone: existingCustomer.phone ?? application.phone ?? undefined,
          website: existingCustomer.website ?? application.website ?? undefined,
          taxId: existingCustomer.taxId ?? application.taxId ?? undefined,
          street: existingCustomer.street ?? application.street ?? undefined,
          city: existingCustomer.city ?? application.city ?? undefined,
          state: existingCustomer.state ?? application.state ?? undefined,
          postalCode: existingCustomer.postalCode ?? application.postalCode ?? undefined,
          country: existingCustomer.country ?? application.country ?? undefined,
          planId: data.planId || application.selectedPlanId || existingCustomer.planId || undefined,
          billingCycle: (data.billingCycle || application.selectedBillingCycle || existingCustomer.billingCycle || 'monthly') as any,
          status: existingCustomer.status === 'active' ? 'active' : 'trial',
          trialStartsAt: existingCustomer.trialStartsAt || now,
          trialEndsAt: trialEndsAt,
          subscriptionStartDate: existingCustomer.subscriptionStartDate || now,
          updatedAt: new Date(),
        },
      });
    } else {
      customer = await prisma.customers.create({
        data: {
          id: customerId,
          company: application.companyName || application.name,
          owner: application.name,
          email: application.email,
          phone: application.phone,
          website: application.website,
          taxId: application.taxId,
          street: application.street,
          city: application.city,
          state: application.state,
          postalCode: application.postalCode,
          country: application.country,
          planId: data.planId || application.selectedPlanId,
          billingCycle: data.billingCycle || application.selectedBillingCycle || 'monthly',
          status: 'trial',
          trialStartsAt: now,
          trialEndsAt,
          subscriptionStartDate: now,
          updatedAt: new Date(),
        },
      });
    }

    // Log trial started event
    await prisma.subscription_events.create({
      data: {
        customerId: customer.id,
        eventType: 'trial_started',
        previousStatus: existingCustomer?.status || null,
        newStatus: 'trial',
        triggeredBy: 'admin',
        metadata: {
          trialDays: data.trialDays || 14,
          approvedBy: adminId,
          applicationId: id,
        },
      },
    });

    // Update application
    await prisma.onboarding_applications.update({
      where: { id },
      data: {
        status: 'approved',
        ...(adminId ? { approvedBy: adminId, approvedAt: new Date() } : { approvedAt: new Date() }),
        customerId: customer.id,
        reviewNotes: data.notes || application.reviewNotes,
      },
    });

    return {
      success: true,
      customerId: customer.id,
      message: 'Application approved and customer account created',
    };
  }

  /**
   * Activate customer account
   */
  async activateApplication(
    id: string,
    adminId: string
  ): Promise<ActivationResult> {
    const application = await prisma.onboarding_applications.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!application) {
      throw new Error('Application not found');
    }

    if (application.status !== 'approved') {
      throw new Error('Application must be approved first');
    }

    if (!application.customerId || !application.customer) {
      throw new Error('Customer account not found');
    }

    // Generate temporary password
    const tempPassword = this.generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Create primary user for the customer
    const userId = uuidv4();
    // Note: property-owner, property-manager, and property-developer get 'owner' role
    // Property managers and developers registering from Get Started page have full control over their properties
    // They are essentially owners of their own customer account
    // Developers get 'developer' role for access to developer-specific features
    let userRole: string;
    if (application.applicationType === 'property-developer' || application.applicationType === 'developer') {
      userRole = 'developer';
    } else if (application.applicationType === 'property-owner' || application.applicationType === 'property-manager') {
      userRole = 'owner';
    } else {
      userRole = 'tenant';
    }

    await prisma.users.create({
      data: {
        id: userId,
        customerId: application.customerId,
        name: application.name,
        email: application.email,
        password: hashedPassword,
        phone: application.phone,
        role: userRole,
        status: 'active',
        isActive: true,
        updatedAt: new Date(),
      },
    });

    // Update customer - keep them in trial status
    // Note: Customer status should remain 'trial' until they upgrade to a paid plan
    // The user status is set to 'active' to allow login
    await prisma.customers.update({
      where: { id: application.customerId },
      data: {
        // Don't change status - it should remain 'trial' from approval
        // status: 'active', // REMOVED - this was causing trial banner to not show
        updatedAt: new Date(),
      },
    });

    // Update application
    await prisma.onboarding_applications.update({
      where: { id },
      data: {
        status: 'activated',
        ...(adminId ? { activatedBy: adminId } : {}),
        activatedAt: new Date(),
        userId,
      },
    });

    return {
      success: true,
      temporaryPassword: tempPassword,
      message: 'Account activated successfully',
    };
  }

  /**
   * Reject application
   */
  async rejectApplication(
    id: string,
    adminId: string,
    data: RejectApplicationInput
  ): Promise<ApplicationWithRelations> {
    const application = await prisma.onboarding_applications.update({
      where: { id },
      data: {
        status: 'rejected',
        rejectionReason: data.reason,
        reviewNotes: data.message || undefined,
        ...(adminId ? { approvedBy: adminId, approvedAt: new Date() } : { approvedAt: new Date() }),
      },
      include: {
        reviewer: true,
        approver: true,
        activator: true,
        customer: true,
        plan: true,
      },
    });

    return application as ApplicationWithRelations;
  }

  /**
   * Request additional information
   */
  async requestInfo(
    id: string,
    adminId: string,
    data: RequestInfoInput
  ): Promise<ApplicationWithRelations> {
    const requestedInfoText = data.requestedInfo.join('\n- ');

    const application = await prisma.onboarding_applications.update({
      where: { id },
      data: {
        status: 'info_requested',
        reviewStatus: 'in_progress',
        reviewNotes: `${data.message}\n\nRequested Information:\n- ${requestedInfoText}`,
        ...(adminId ? { reviewedBy: adminId } : {}),
        reviewedAt: new Date(),
      },
      include: {
        reviewer: true,
        approver: true,
        activator: true,
        customer: true,
        plan: true,
      },
    });

    return application as ApplicationWithRelations;
  }

  /**
   * Get application statistics
   */
  async getStats(): Promise<ApplicationStats> {
    const [pending, under_review, info_requested, approved, rejected, activated] =
      await Promise.all([
        prisma.onboarding_applications.count({ where: { status: 'pending' } }),
        prisma.onboarding_applications.count({ where: { status: 'under_review' } }),
        prisma.onboarding_applications.count({ where: { status: 'info_requested' } }),
        prisma.onboarding_applications.count({ where: { status: 'approved' } }),
        prisma.onboarding_applications.count({ where: { status: 'rejected' } }),
        prisma.onboarding_applications.count({ where: { status: 'activated' } }),
      ]);

    const total = pending + under_review + info_requested + approved + rejected + activated;

    return {
      pending,
      under_review,
      info_requested,
      approved,
      rejected,
      activated,
      total,
    };
  }

  /**
   * Build application timeline
   */
  private buildTimeline(application: any): ApplicationTimeline[] {
    const timeline: ApplicationTimeline[] = [];

    timeline.push({
      action: 'Application Submitted',
      timestamp: application.createdAt,
      actor: application.name,
    });

    if (application.reviewedAt) {
      timeline.push({
        action: 'Under Review',
        timestamp: application.reviewedAt,
        actor: application.reviewer?.name || 'Admin',
      });
    }

    if (application.status === 'info_requested') {
      timeline.push({
        action: 'Additional Information Requested',
        timestamp: application.updatedAt,
        actor: application.reviewer?.name || 'Admin',
      });
    }

    if (application.approvedAt) {
      timeline.push({
        action: application.status === 'rejected' ? 'Application Rejected' : 'Application Approved',
        timestamp: application.approvedAt,
        actor: application.approver?.name || 'Admin',
        details: application.status === 'rejected' ? application.rejectionReason : undefined,
      });
    }

    if (application.activatedAt) {
      timeline.push({
        action: 'Account Activated',
        timestamp: application.activatedAt,
        actor: application.activator?.name || 'Admin',
      });
    }

    return timeline;
  }

  /**
   * Delete application
   */
  async deleteApplication(id: string): Promise<{ success: boolean }> {
    const application = await prisma.onboarding_applications.findUnique({
      where: { id },
    });

    if (!application) {
      throw new Error('Application not found');
    }

    // Check if customer account exists and is active
    if (application.customerId) {
      const customer = await prisma.customers.findUnique({
        where: { id: application.customerId },
        select: { id: true, status: true, email: true }
      });

      if (customer) {
        throw new Error(`Cannot delete application: Customer account exists (${customer.email}). Please deactivate or delete the customer account first.`);
      }
    }

    // If there's a user but no customer, we can safely delete (orphaned user)
    // The user will be cleaned up separately if needed

    await prisma.onboarding_applications.delete({
      where: { id },
    });

    return { success: true };
  }

  /**
   * Generate temporary password
   */
  private generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}

export const onboardingService = new OnboardingService();

