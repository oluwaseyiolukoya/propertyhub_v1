import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { notificationService } from '../services/notification.service';

const router = express.Router();
const prisma = new PrismaClient();

// Middleware to ensure user has customerId
const customerOnly = (req: AuthRequest, res: Response, next: any) => {
  if (!req.user?.customerId) {
    return res.status(403).json({ error: 'Access denied. Customer account required.' });
  }
  next();
};

/**
 * Generate a secure temporary password
 * Format: 3 words + 3 digits (e.g., "Secure-Login-2024-847")
 */
function generateTemporaryPassword(): string {
  const words = [
    'Secure', 'Access', 'Login', 'Portal', 'Entry', 'Gateway',
    'Connect', 'Welcome', 'Start', 'Begin', 'Launch', 'Open'
  ];

  const word1 = words[Math.floor(Math.random() * words.length)];
  const word2 = words[Math.floor(Math.random() * words.length)];
  const year = new Date().getFullYear();
  const randomDigits = Math.floor(100 + Math.random() * 900); // 3 digits

  return `${word1}-${word2}-${year}-${randomDigits}`;
}

// ============================================
// TEAM MEMBERS ENDPOINTS
// ============================================

/**
 * POST /api/team/test-email
 * Test email sending functionality (for debugging production issues)
 */
router.post('/test-email', authMiddleware, customerOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { email } = req.body;
    const testEmail = email || req.user!.email;

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🧪 [TEST EMAIL] Starting test email send...');
    console.log('🧪 [TEST EMAIL] Recipient:', testEmail);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const { sendTeamInvitation } = require('../lib/email');

    const result = await sendTeamInvitation({
      memberName: 'Test User',
      memberEmail: testEmail,
      companyName: 'Test Company',
      roleName: 'Test Role',
      inviterName: 'Admin',
      temporaryPassword: 'Test-Password-2024-123',
      expiryHours: 48,
      loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/signin`,
      department: 'IT',
      jobTitle: 'Developer',
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🧪 [TEST EMAIL] Result: ${result ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    res.json({
      success: result,
      message: result ? 'Test email sent successfully! Check your inbox.' : 'Failed to send test email. Check server logs.',
      recipient: testEmail,
    });
  } catch (error: any) {
    console.error('🧪 [TEST EMAIL] Exception:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.toString(),
    });
  }
});

/**
 * GET /api/team/members
 * Get all team members for the customer
 */
router.get('/members', authMiddleware, customerOnly, async (req: AuthRequest, res: Response) => {
  try {
    const customerId = req.user!.customerId;
    const { status, role, canApprove } = req.query;

    const where: any = { customer_id: customerId };

    if (status) where.status = status as string;
    if (role) where.role_id = role as string;
    if (canApprove === 'true') where.can_approve_invoices = true;

    const members = await prisma.team_members.findMany({
      where,
      include: {
        role: {
          select: {
            id: true,
            name: true,
            description: true,
            can_approve_invoices: true,
            approval_limit: true,
          },
        },
        delegate: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' },
        { first_name: 'asc' },
      ],
    });

    // Transform to camelCase for frontend
    const transformedMembers = members.map(member => ({
      id: member.id,
      firstName: member.first_name,
      lastName: member.last_name,
      email: member.email,
      phone: member.phone,
      jobTitle: member.job_title,
      department: member.department,
      status: member.status,
      role: {
        id: member.role.id,
        name: member.role.name,
        description: member.role.description,
        canApproveInvoices: member.role.can_approve_invoices,
        approvalLimit: member.role.approval_limit ? Number(member.role.approval_limit) : null,
      },
      canApproveInvoices: member.can_approve_invoices,
      approvalLimit: member.approval_limit ? Number(member.approval_limit) : null,
      canCreateInvoices: member.can_create_invoices,
      canManageProjects: member.can_manage_projects,
      canViewReports: member.can_view_reports,
      delegation: member.delegate ? {
        delegateTo: member.delegate.id,
        delegateeName: `${member.delegate.first_name} ${member.delegate.last_name}`,
        start: member.delegation_start,
        end: member.delegation_end,
      } : null,
      invitedBy: member.inviter ? {
        id: member.inviter.id,
        name: member.inviter.name,
      } : null,
      invitedAt: member.invited_at,
      joinedAt: member.joined_at,
      lastActive: member.last_active,
      createdAt: member.created_at,
    }));

    res.json({ success: true, data: transformedMembers });
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({ error: 'Failed to fetch team members' });
  }
});

/**
 * GET /api/team/members/:memberId
 * Get a single team member
 */
router.get('/members/:memberId', authMiddleware, customerOnly, async (req: AuthRequest, res: Response) => {
  try {
    const customerId = req.user!.customerId;
    const { memberId } = req.params;

    const member = await prisma.team_members.findFirst({
      where: {
        id: memberId,
        customer_id: customerId,
      },
      include: {
        role: true,
        delegate: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!member) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    const transformedMember = {
      id: member.id,
      firstName: member.first_name,
      lastName: member.last_name,
      email: member.email,
      phone: member.phone,
      jobTitle: member.job_title,
      department: member.department,
      status: member.status,
      role: {
        id: member.role.id,
        name: member.role.name,
        description: member.role.description,
        permissions: member.role.permissions,
        canApproveInvoices: member.role.can_approve_invoices,
        approvalLimit: member.role.approval_limit ? Number(member.role.approval_limit) : null,
      },
      canApproveInvoices: member.can_approve_invoices,
      approvalLimit: member.approval_limit ? Number(member.approval_limit) : null,
      canCreateInvoices: member.can_create_invoices,
      canManageProjects: member.can_manage_projects,
      canViewReports: member.can_view_reports,
      delegation: member.delegate ? {
        delegateTo: member.delegate.id,
        delegateeName: `${member.delegate.first_name} ${member.delegate.last_name}`,
        start: member.delegation_start,
        end: member.delegation_end,
      } : null,
      invitedBy: member.inviter ? {
        id: member.inviter.id,
        name: member.inviter.name,
      } : null,
      invitedAt: member.invited_at,
      joinedAt: member.joined_at,
      lastActive: member.last_active,
    };

    res.json({ success: true, data: transformedMember });
  } catch (error) {
    console.error('Error fetching team member:', error);
    res.status(500).json({ error: 'Failed to fetch team member' });
  }
});

/**
 * POST /api/team/members
 * Create/invite a new team member
 */
router.post('/members', authMiddleware, customerOnly, async (req: AuthRequest, res: Response) => {
  try {
    const customerId = req.user!.customerId;
    const userId = req.user!.id;

    console.log('📝 Team member invitation request:', {
      customerId,
      userId,
      body: req.body,
    });

    const {
      firstName,
      lastName,
      email,
      phone,
      jobTitle,
      department,
      roleId,
      canApproveInvoices,
      approvalLimit,
      canCreateInvoices,
      canManageProjects,
      canViewReports,
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !roleId) {
      console.error('❌ Missing required fields');
      return res.status(400).json({ error: 'Missing required fields: firstName, lastName, email, roleId' });
    }

    // Check if email already exists for this customer
    const existingMember = await prisma.team_members.findFirst({
      where: {
        customer_id: customerId,
        email: email.toLowerCase(),
      },
    });

    if (existingMember) {
      return res.status(400).json({ error: 'A team member with this email already exists' });
    }

    // Verify role exists and belongs to customer or is a system role
    const role = await prisma.team_roles.findFirst({
      where: {
        id: roleId,
        OR: [
          { customer_id: customerId },
          { is_system_role: true },
        ],
      },
    });

    if (!role) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Generate temporary password
    const temporaryPassword = generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
    const tempPasswordExpiresAt = new Date();
    tempPasswordExpiresAt.setHours(tempPasswordExpiresAt.getHours() + 48); // 48 hours
    const now = new Date();

    // Check if user account already exists
    console.log('🔍 Checking if user exists:', email.toLowerCase());
    let user = await prisma.users.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      console.log('👤 Creating new user account (Prisma)...');

      // Get the customer to determine the correct role
      const customer = await prisma.customers.findUnique({
        where: { id: customerId },
        include: {
          users: {
            where: {
              role: { in: ['developer', 'property-developer', 'owner', 'property-owner'] }
            },
            take: 1
          }
        }
      });

      // Determine role based on customer's primary user role
      let userRole = 'customer';
      if (customer?.users && customer.users.length > 0) {
        const primaryRole = customer.users[0].role.toLowerCase();
        if (primaryRole.includes('developer')) {
          userRole = 'developer';
        } else if (primaryRole.includes('owner')) {
          userRole = 'owner';
        }
      }

      console.log(`👤 Creating user with role: ${userRole} (based on customer type)`);

      // Create user account via Prisma (trigger is now fixed to use NEW."customerId")
      user = await prisma.users.create({
        data: {
          id: crypto.randomUUID(),
          customerId: customerId,
          name: `${firstName} ${lastName}`,
          email: email.toLowerCase(),
          password: hashedPassword,
          phone,
          role: userRole, // Use detected role
          department,
          company: jobTitle,
          isActive: true,
          status: 'invited',
          is_temp_password: true,
          temp_password_expires_at: tempPasswordExpiresAt,
          must_change_password: true,
          invitedAt: now,
        },
      });
      console.log(`✅ User account created: ${email} with role: ${userRole}`);
    } else {
      // Update existing user with new temporary password
      user = await prisma.users.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          is_temp_password: true,
          temp_password_expires_at: tempPasswordExpiresAt,
          must_change_password: true,
          status: 'invited',
        },
      });
      console.log(`✅ User account updated with new password: ${email}`);
    }

    // Create team member
    console.log('👥 Creating team member record...');
    const member = await prisma.team_members.create({
      data: {
        customer_id: customerId,
        user_id: user.id,
        role_id: roleId,
        first_name: firstName,
        last_name: lastName,
        email: email.toLowerCase(),
        phone,
        job_title: jobTitle,
        department,
        status: 'invited',
        can_approve_invoices: canApproveInvoices || false,
        approval_limit: approvalLimit ? BigInt(approvalLimit * 100) : null,
        can_create_invoices: canCreateInvoices || false,
        can_manage_projects: canManageProjects || false,
        can_view_reports: canViewReports || false,
        invited_by: userId,
      },
      include: {
        role: true,
      },
    });

    console.log(`✅ Team member invited: ${email} by ${userId}`);

    // Get inviter details
    const inviter = await prisma.users.findUnique({
      where: { id: userId },
    });

    // Get customer/company details
    const customer = await prisma.customers.findUnique({
      where: { id: customerId },
    });

    // Send invitation email with temporary password (INSTANT DELIVERY like onboarding)
    let emailSent = false;
    try {
      const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/signin`;

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('[Team Invitation] 📧 Starting invitation email process...');
      console.log('[Team Invitation] Recipient:', email.toLowerCase());
      console.log('[Team Invitation] Member:', `${firstName} ${lastName}`);
      console.log('[Team Invitation] Role:', member.role.name);
      console.log('[Team Invitation] SMTP Host:', process.env.SMTP_HOST || 'NOT SET');
      console.log('[Team Invitation] SMTP From:', process.env.SMTP_FROM || 'NOT SET');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // Import email function
      const { sendTeamInvitation } = require('../lib/email');

      emailSent = await sendTeamInvitation({
        memberName: `${firstName} ${lastName}`,
        memberEmail: email.toLowerCase(),
        companyName: customer?.company || 'Your Organization',
        roleName: member.role.name,
        inviterName: inviter?.name || 'Your Team Admin',
        temporaryPassword: temporaryPassword,
        expiryHours: 48,
        loginUrl: loginUrl,
        department: department || '',
        jobTitle: jobTitle || '',
      });

      if (emailSent) {
        console.log('[Team Invitation] ✅✅✅ Invitation email sent successfully to:', email);
      } else {
        console.error('[Team Invitation] ❌❌❌ Failed to send invitation email to:', email);
      }
    } catch (emailError: any) {
      console.error('[Team Invitation] ❌❌❌ EXCEPTION while sending invitation email:', emailError);
      console.error('[Team Invitation] Error details:', {
        message: emailError?.message,
        code: emailError?.code,
        stack: emailError?.stack?.split('\n')[0]
      });
      // Don't fail the request if email fails
    }

    res.json({
      success: true,
      message: 'Team member invited successfully. Invitation email sent with temporary password.',
      data: {
        id: member.id,
        email: member.email,
        status: member.status,
        firstName: member.first_name,
        lastName: member.last_name,
        role: {
          id: member.role.id,
          name: member.role.name,
        },
        temporaryPassword: temporaryPassword, // Include in response for admin to see
        passwordExpiresAt: tempPasswordExpiresAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error creating team member:', error);
    res.status(500).json({
      error: 'Failed to create team member',
      message: error.message,
      details: error.toString()
    });
  }
});

/**
 * PUT /api/team/members/:memberId
 * Update a team member
 */
router.put('/members/:memberId', authMiddleware, customerOnly, async (req: AuthRequest, res: Response) => {
  try {
    const customerId = req.user!.customerId;
    const { memberId } = req.params;

    const {
      firstName,
      lastName,
      phone,
      jobTitle,
      department,
      roleId,
      canApproveInvoices,
      approvalLimit,
      canCreateInvoices,
      canManageProjects,
      canViewReports,
      status,
    } = req.body;

    // Verify member exists and belongs to customer
    const existingMember = await prisma.team_members.findFirst({
      where: {
        id: memberId,
        customer_id: customerId,
      },
    });

    if (!existingMember) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    // Build update data
    const updateData: any = {};
    if (firstName !== undefined) updateData.first_name = firstName;
    if (lastName !== undefined) updateData.last_name = lastName;
    if (phone !== undefined) updateData.phone = phone;
    if (jobTitle !== undefined) updateData.job_title = jobTitle;
    if (department !== undefined) updateData.department = department;
    if (roleId !== undefined) updateData.role_id = roleId;
    if (canApproveInvoices !== undefined) updateData.can_approve_invoices = canApproveInvoices;
    if (approvalLimit !== undefined) updateData.approval_limit = approvalLimit ? BigInt(approvalLimit * 100) : null;
    if (canCreateInvoices !== undefined) updateData.can_create_invoices = canCreateInvoices;
    if (canManageProjects !== undefined) updateData.can_manage_projects = canManageProjects;
    if (canViewReports !== undefined) updateData.can_view_reports = canViewReports;
    if (status !== undefined) updateData.status = status;
    updateData.updated_at = new Date();

    // Update member
    const updatedMember = await prisma.team_members.update({
      where: { id: memberId },
      data: updateData,
      include: {
        role: true,
      },
    });

    console.log(`✅ Team member updated: ${memberId}`);

    res.json({
      success: true,
      message: 'Team member updated successfully',
      data: {
        id: updatedMember.id,
        firstName: updatedMember.first_name,
        lastName: updatedMember.last_name,
        email: updatedMember.email,
        status: updatedMember.status,
        role: {
          id: updatedMember.role.id,
          name: updatedMember.role.name,
        },
      },
    });
  } catch (error) {
    console.error('Error updating team member:', error);
    res.status(500).json({ error: 'Failed to update team member' });
  }
});

/**
 * DELETE /api/team/members/:memberId
 * Delete a team member
 */
router.delete('/members/:memberId', authMiddleware, customerOnly, async (req: AuthRequest, res: Response) => {
  try {
    const customerId = req.user!.customerId;
    const { memberId } = req.params;

    // Verify member exists and belongs to customer
    const member = await prisma.team_members.findFirst({
      where: {
        id: memberId,
        customer_id: customerId,
      },
    });

    if (!member) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    // Delete member
    await prisma.team_members.delete({
      where: { id: memberId },
    });

    console.log(`✅ Team member deleted: ${memberId}`);

    res.json({
      success: true,
      message: 'Team member removed successfully',
    });
  } catch (error) {
    console.error('Error deleting team member:', error);
    res.status(500).json({ error: 'Failed to delete team member' });
  }
});

/**
 * POST /api/team/members/:memberId/delegate
 * Set delegation for a team member
 */
router.post('/members/:memberId/delegate', authMiddleware, customerOnly, async (req: AuthRequest, res: Response) => {
  try {
    const customerId = req.user!.customerId;
    const { memberId } = req.params;
    const { delegateTo, startDate, endDate, reason } = req.body;

    if (!delegateTo || !startDate || !endDate) {
      return res.status(400).json({ error: 'Missing required fields: delegateTo, startDate, endDate' });
    }

    // Verify both members exist and belong to customer
    const [member, delegate] = await Promise.all([
      prisma.team_members.findFirst({
        where: { id: memberId, customer_id: customerId },
      }),
      prisma.team_members.findFirst({
        where: { id: delegateTo, customer_id: customerId, status: 'active' },
      }),
    ]);

    if (!member) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    if (!delegate) {
      return res.status(404).json({ error: 'Delegate not found or not active' });
    }

    // Update delegation
    const updatedMember = await prisma.team_members.update({
      where: { id: memberId },
      data: {
        delegate_to: delegateTo,
        delegation_start: new Date(startDate),
        delegation_end: new Date(endDate),
        updated_at: new Date(),
      },
      include: {
        delegate: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    console.log(`✅ Delegation set: ${memberId} → ${delegateTo}`);

    // TODO: Send notification to delegate

    res.json({
      success: true,
      message: 'Delegation set successfully. Delegate will be notified.',
      data: {
        delegateTo: updatedMember.delegate!.id,
        delegateeName: `${updatedMember.delegate!.first_name} ${updatedMember.delegate!.last_name}`,
        startDate: updatedMember.delegation_start,
        endDate: updatedMember.delegation_end,
      },
    });
  } catch (error) {
    console.error('Error setting delegation:', error);
    res.status(500).json({ error: 'Failed to set delegation' });
  }
});

// ============================================
// TEAM ROLES ENDPOINTS
// ============================================

/**
 * GET /api/team/roles
 * Get all roles for the customer
 */
router.get('/roles', authMiddleware, customerOnly, async (req: AuthRequest, res: Response) => {
  try {
    const customerId = req.user!.customerId;

    const roles = await prisma.team_roles.findMany({
      where: {
        OR: [
          { customer_id: customerId },
          { is_system_role: true },
        ],
      },
      include: {
        _count: {
          select: { team_members: true },
        },
      },
      orderBy: [
        { is_system_role: 'desc' },
        { name: 'asc' },
      ],
    });

    const transformedRoles = roles.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description,
      isSystemRole: role.is_system_role,
      canApproveInvoices: role.can_approve_invoices,
      approvalLimit: role.approval_limit ? Number(role.approval_limit) : null,
      permissions: role.permissions,
      memberCount: role._count.team_members,
      createdAt: role.created_at,
    }));

    res.json({ success: true, data: transformedRoles });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

/**
 * POST /api/team/roles
 * Create a custom role
 */
router.post('/roles', authMiddleware, customerOnly, async (req: AuthRequest, res: Response) => {
  try {
    const customerId = req.user!.customerId;
    const {
      name,
      description,
      canApproveInvoices,
      approvalLimit,
      permissions,
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Role name is required' });
    }

    // Check if role name already exists for this customer
    const existingRole = await prisma.team_roles.findFirst({
      where: {
        customer_id: customerId,
        name,
      },
    });

    if (existingRole) {
      return res.status(400).json({ error: 'A role with this name already exists' });
    }

    // Create role
    const role = await prisma.team_roles.create({
      data: {
        customer_id: customerId,
        name,
        description,
        is_system_role: false,
        can_approve_invoices: canApproveInvoices || false,
        approval_limit: approvalLimit ? BigInt(approvalLimit * 100) : null,
        permissions: permissions || {},
      },
    });

    console.log(`✅ Custom role created: ${name} for customer ${customerId}`);

    res.json({
      success: true,
      message: 'Role created successfully',
      data: {
        id: role.id,
        name: role.name,
        description: role.description,
        canApproveInvoices: role.can_approve_invoices,
        approvalLimit: role.approval_limit ? Number(role.approval_limit) : null,
      },
    });
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({ error: 'Failed to create role' });
  }
});

export default router;

