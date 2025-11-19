import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';
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

// ============================================
// WORKFLOW MANAGEMENT ENDPOINTS
// ============================================

/**
 * GET /api/approvals/workflows
 * Get all approval workflows for the customer
 */
router.get('/workflows', authMiddleware, customerOnly, async (req: AuthRequest, res: Response) => {
  try {
    const customerId = req.user!.customerId;

    const workflows = await prisma.invoice_approval_workflows.findMany({
      where: { customer_id: customerId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: { invoice_approvals: true },
        },
      },
      orderBy: [
        { is_default: 'desc' },
        { is_active: 'desc' },
        { name: 'asc' },
      ],
    });

    const transformedWorkflows = workflows.map(workflow => ({
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      isActive: workflow.is_active,
      isDefault: workflow.is_default,
      minAmount: workflow.min_amount ? Number(workflow.min_amount) : null,
      maxAmount: workflow.max_amount ? Number(workflow.max_amount) : null,
      categories: workflow.categories,
      approvalLevels: workflow.approval_levels,
      autoApproveUnder: workflow.auto_approve_under ? Number(workflow.auto_approve_under) : null,
      createdBy: workflow.creator ? {
        id: workflow.creator.id,
        name: workflow.creator.name,
      } : null,
      createdAt: workflow.created_at,
      updatedAt: workflow.updated_at,
      usageCount: workflow._count.invoice_approvals,
    }));

    res.json({ success: true, data: transformedWorkflows });
  } catch (error) {
    console.error('Error fetching workflows:', error);
    res.status(500).json({ error: 'Failed to fetch workflows' });
  }
});

/**
 * GET /api/approvals/workflows/:workflowId
 * Get a single workflow
 */
router.get('/workflows/:workflowId', authMiddleware, customerOnly, async (req: AuthRequest, res: Response) => {
  try {
    const customerId = req.user!.customerId;
    const { workflowId } = req.params;

    const workflow = await prisma.invoice_approval_workflows.findFirst({
      where: {
        id: workflowId,
        customer_id: customerId,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    const transformedWorkflow = {
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      isActive: workflow.is_active,
      isDefault: workflow.is_default,
      minAmount: workflow.min_amount ? Number(workflow.min_amount) : null,
      maxAmount: workflow.max_amount ? Number(workflow.max_amount) : null,
      categories: workflow.categories,
      approvalLevels: workflow.approval_levels,
      autoApproveUnder: workflow.auto_approve_under ? Number(workflow.auto_approve_under) : null,
      createdBy: workflow.creator ? {
        id: workflow.creator.id,
        name: workflow.creator.name,
      } : null,
      createdAt: workflow.created_at,
      updatedAt: workflow.updated_at,
    };

    res.json({ success: true, data: transformedWorkflow });
  } catch (error) {
    console.error('Error fetching workflow:', error);
    res.status(500).json({ error: 'Failed to fetch workflow' });
  }
});

/**
 * POST /api/approvals/workflows
 * Create a new approval workflow
 */
router.post('/workflows', authMiddleware, customerOnly, async (req: AuthRequest, res: Response) => {
  try {
    const customerId = req.user!.customerId;
    const userId = req.user!.id;

    const {
      name,
      description,
      isActive,
      isDefault,
      minAmount,
      maxAmount,
      categories,
      approvalLevels,
      autoApproveUnder,
    } = req.body;

    // Validate required fields
    if (!name || !approvalLevels || !Array.isArray(approvalLevels) || approvalLevels.length === 0) {
      return res.status(400).json({
        error: 'Missing required fields: name and approvalLevels (must be a non-empty array)'
      });
    }

    // Check if workflow name already exists for this customer
    const existingWorkflow = await prisma.invoice_approval_workflows.findFirst({
      where: {
        customer_id: customerId,
        name,
      },
    });

    if (existingWorkflow) {
      return res.status(400).json({ error: 'A workflow with this name already exists' });
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.invoice_approval_workflows.updateMany({
        where: {
          customer_id: customerId,
          is_default: true,
        },
        data: {
          is_default: false,
        },
      });
    }

    // Create workflow
    const workflow = await prisma.invoice_approval_workflows.create({
      data: {
        customer_id: customerId,
        name,
        description,
        is_active: isActive !== undefined ? isActive : true,
        is_default: isDefault || false,
        min_amount: minAmount ? BigInt(Math.round(minAmount * 100)) : null,
        max_amount: maxAmount ? BigInt(Math.round(maxAmount * 100)) : null,
        categories: categories || [],
        approval_levels: approvalLevels,
        auto_approve_under: autoApproveUnder ? BigInt(Math.round(autoApproveUnder * 100)) : null,
        created_by: userId,
      },
    });

    console.log(`✅ Workflow created: ${name} by ${userId}`);

    res.json({
      success: true,
      message: 'Workflow created successfully',
      data: {
        id: workflow.id,
        name: workflow.name,
        isActive: workflow.is_active,
        isDefault: workflow.is_default,
      },
    });
  } catch (error) {
    console.error('Error creating workflow:', error);
    res.status(500).json({ error: 'Failed to create workflow' });
  }
});

/**
 * PUT /api/approvals/workflows/:workflowId
 * Update an approval workflow
 */
router.put('/workflows/:workflowId', authMiddleware, customerOnly, async (req: AuthRequest, res: Response) => {
  try {
    const customerId = req.user!.customerId;
    const { workflowId } = req.params;

    const {
      name,
      description,
      isActive,
      isDefault,
      minAmount,
      maxAmount,
      categories,
      approvalLevels,
      autoApproveUnder,
    } = req.body;

    // Verify workflow exists and belongs to customer
    const existingWorkflow = await prisma.invoice_approval_workflows.findFirst({
      where: {
        id: workflowId,
        customer_id: customerId,
      },
    });

    if (!existingWorkflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    // If setting as default, unset other defaults
    if (isDefault && !existingWorkflow.is_default) {
      await prisma.invoice_approval_workflows.updateMany({
        where: {
          customer_id: customerId,
          is_default: true,
        },
        data: {
          is_default: false,
        },
      });
    }

    // Build update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.is_active = isActive;
    if (isDefault !== undefined) updateData.is_default = isDefault;
    if (minAmount !== undefined) updateData.min_amount = minAmount ? BigInt(Math.round(minAmount * 100)) : null;
    if (maxAmount !== undefined) updateData.max_amount = maxAmount ? BigInt(Math.round(maxAmount * 100)) : null;
    if (categories !== undefined) updateData.categories = categories;
    if (approvalLevels !== undefined) updateData.approval_levels = approvalLevels;
    if (autoApproveUnder !== undefined) updateData.auto_approve_under = autoApproveUnder ? BigInt(Math.round(autoApproveUnder * 100)) : null;
    updateData.updated_at = new Date();

    // Update workflow
    const updatedWorkflow = await prisma.invoice_approval_workflows.update({
      where: { id: workflowId },
      data: updateData,
    });

    console.log(`✅ Workflow updated: ${workflowId}`);

    res.json({
      success: true,
      message: 'Workflow updated successfully',
      data: {
        id: updatedWorkflow.id,
        name: updatedWorkflow.name,
        isActive: updatedWorkflow.is_active,
      },
    });
  } catch (error) {
    console.error('Error updating workflow:', error);
    res.status(500).json({ error: 'Failed to update workflow' });
  }
});

/**
 * DELETE /api/approvals/workflows/:workflowId
 * Delete an approval workflow
 */
router.delete('/workflows/:workflowId', authMiddleware, customerOnly, async (req: AuthRequest, res: Response) => {
  try {
    const customerId = req.user!.customerId;
    const { workflowId } = req.params;

    // Verify workflow exists and belongs to customer
    const workflow = await prisma.invoice_approval_workflows.findFirst({
      where: {
        id: workflowId,
        customer_id: customerId,
      },
      include: {
        _count: {
          select: { invoice_approvals: true },
        },
      },
    });

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    // Check if workflow is in use
    if (workflow._count.invoice_approvals > 0) {
      return res.status(400).json({
        error: 'Cannot delete workflow that is in use. Deactivate it instead.',
        usageCount: workflow._count.invoice_approvals,
      });
    }

    // Delete workflow
    await prisma.invoice_approval_workflows.delete({
      where: { id: workflowId },
    });

    console.log(`✅ Workflow deleted: ${workflowId}`);

    res.json({
      success: true,
      message: 'Workflow deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting workflow:', error);
    res.status(500).json({ error: 'Failed to delete workflow' });
  }
});

// ============================================
// APPROVAL PROCESSING ENDPOINTS
// ============================================

/**
 * GET /api/approvals/pending
 * Get pending approvals for the current user
 */
router.get('/pending', authMiddleware, customerOnly, async (req: AuthRequest, res: Response) => {
  try {
    const customerId = req.user!.customerId;
    const userId = req.user!.id;
    const { sort, limit } = req.query;

    // Find team member for this user
    const teamMember = await prisma.team_members.findFirst({
      where: {
        customer_id: customerId,
        user_id: userId,
        status: 'active',
      },
    });

    if (!teamMember) {
      return res.json({ success: true, data: [], meta: { total: 0, overdue: 0, dueSoon: 0 } });
    }

    // Get pending approvals
    const where: any = {
      approver_id: teamMember.id,
      status: 'pending',
    };

    let orderBy: any = { requested_at: 'asc' };
    if (sort === 'dueDate') orderBy = { due_at: 'asc' };
    if (sort === 'amount') orderBy = { invoice: { amount: 'desc' } };

    const approvals = await prisma.invoice_approvals.findMany({
      where,
      include: {
        invoice: {
          include: {
            vendor: {
              select: {
                id: true,
                name: true,
              },
            },
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        workflow: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy,
      take: limit ? parseInt(limit as string) : 50,
    });

    // Calculate metadata
    const now = new Date();
    const dueSoonThreshold = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
    let overdue = 0;
    let dueSoon = 0;

    const transformedApprovals = approvals.map(approval => {
      const hoursRemaining = approval.due_at
        ? Math.round((approval.due_at.getTime() - now.getTime()) / (1000 * 60 * 60))
        : null;

      if (approval.due_at) {
        if (approval.due_at < now) overdue++;
        else if (approval.due_at < dueSoonThreshold) dueSoon++;
      }

      return {
        id: approval.id,
        invoice: {
          id: approval.invoice.id,
          invoiceNumber: approval.invoice.invoiceNumber,
          amount: Number(approval.invoice.amount),
          currency: approval.invoice.currency,
          vendor: approval.invoice.vendor ? {
            id: approval.invoice.vendor.id,
            name: approval.invoice.vendor.name,
          } : null,
          category: approval.invoice.category,
          description: approval.invoice.description,
          project: approval.invoice.project ? {
            id: approval.invoice.project.id,
            name: approval.invoice.project.name,
          } : null,
          createdAt: approval.invoice.createdAt,
        },
        workflow: approval.workflow ? {
          id: approval.workflow.id,
          name: approval.workflow.name,
        } : null,
        level: approval.level,
        levelName: approval.level_name,
        status: approval.status,
        requestedAt: approval.requested_at,
        dueAt: approval.due_at,
        hoursRemaining,
      };
    });

    res.json({
      success: true,
      data: transformedApprovals,
      meta: {
        total: approvals.length,
        overdue,
        dueSoon,
      },
    });
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    res.status(500).json({ error: 'Failed to fetch pending approvals' });
  }
});

/**
 * POST /api/approvals/:approvalId/approve
 * Approve an invoice
 */
router.post('/:approvalId/approve', authMiddleware, customerOnly, async (req: AuthRequest, res: Response) => {
  try {
    const customerId = req.user!.customerId;
    const userId = req.user!.id;
    const { approvalId } = req.params;
    const { comments } = req.body;

    // Find team member for this user
    const teamMember = await prisma.team_members.findFirst({
      where: {
        customer_id: customerId,
        user_id: userId,
        status: 'active',
      },
    });

    if (!teamMember) {
      return res.status(403).json({ error: 'You are not an active team member' });
    }

    // Get approval
    const approval = await prisma.invoice_approvals.findFirst({
      where: {
        id: approvalId,
        approver_id: teamMember.id,
      },
      include: {
        invoice: true,
        workflow: true,
      },
    });

    if (!approval) {
      return res.status(404).json({ error: 'Approval not found or not assigned to you' });
    }

    if (approval.status !== 'pending') {
      return res.status(400).json({ error: `Approval already ${approval.status}` });
    }

    // Check approval limit
    if (teamMember.approval_limit) {
      const invoiceAmount = Number(approval.invoice.amount);
      const memberLimit = Number(teamMember.approval_limit) / 100; // Convert from kobo

      if (invoiceAmount > memberLimit) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          message: `You can only approve invoices up to ₦${memberLimit.toLocaleString()}`,
          invoiceAmount,
          yourLimit: memberLimit,
        });
      }
    }

    // Update approval
    const updatedApproval = await prisma.invoice_approvals.update({
      where: { id: approvalId },
      data: {
        status: 'approved',
        decision: 'approved',
        comments,
        responded_at: new Date(),
      },
    });

    console.log(`✅ Invoice approved: ${approval.invoice.invoiceNumber} by ${teamMember.first_name} ${teamMember.last_name}`);

    // Send notification to invoice creator
    try {
      const invoice = approval.invoice as any;
      if (invoice.created_by) {
        await notificationService.sendTemplatedNotification(
          'invoice_approved',
          {
            requesterName: 'User',
            invoiceNumber: invoice.invoiceNumber || 'N/A',
            amount: `₦${(Number(invoice.amount) || 0).toLocaleString()}`,
            approverName: `${teamMember.first_name} ${teamMember.last_name}`,
            approvedAt: new Date().toLocaleString(),
            actionUrl: `/invoices/${invoice.id}`,
          },
          {
            customerId,
            userId: invoice.created_by,
            type: 'invoice_approved',
            sendEmail: true,
          }
        );
      }
    } catch (notifError) {
      console.error('Error sending approval notification:', notifError);
      // Don't fail the approval if notification fails
    }

    // Check if all approvals for this level are complete
    const levelApprovals = await prisma.invoice_approvals.findMany({
      where: {
        invoice_id: approval.invoice_id,
        level: approval.level,
      },
    });

    const approvedCount = levelApprovals.filter(a => a.status === 'approved').length;
    const workflow = approval.workflow;
    const currentLevel = workflow?.approval_levels as any;
    const requiredApprovals = currentLevel?.[approval.level - 1]?.required_approvers || 1;

    let nextLevel = null;
    let nextApprovers = [];
    let invoiceStatus = 'in_approval';

    if (approvedCount >= requiredApprovals) {
      // Level complete, check if there's a next level
      const totalLevels = Array.isArray(currentLevel) ? currentLevel.length : 0;

      if (approval.level < totalLevels) {
        // Create approvals for next level
        nextLevel = approval.level + 1;
        const nextLevelConfig = currentLevel[nextLevel - 1];

        // TODO: Create approval requests for next level
        // This would involve finding approvers based on nextLevelConfig.approver_roles

      } else {
        // All levels approved
        await prisma.project_invoices.update({
          where: { id: approval.invoice_id },
          data: { status: 'approved' },
        });
        invoiceStatus = 'approved';
      }
    }

    res.json({
      success: true,
      message: 'Invoice approved successfully',
      data: {
        approvalId: updatedApproval.id,
        status: updatedApproval.status,
        respondedAt: updatedApproval.responded_at,
        nextLevel,
        nextApprovers,
        invoiceStatus,
      },
    });
  } catch (error) {
    console.error('Error approving invoice:', error);
    res.status(500).json({ error: 'Failed to approve invoice' });
  }
});

/**
 * POST /api/approvals/:approvalId/reject
 * Reject an invoice
 */
router.post('/:approvalId/reject', authMiddleware, customerOnly, async (req: AuthRequest, res: Response) => {
  try {
    const customerId = req.user!.customerId;
    const userId = req.user!.id;
    const { approvalId } = req.params;
    const { comments, reason } = req.body;

    if (!comments) {
      return res.status(400).json({ error: 'Comments are required when rejecting an invoice' });
    }

    // Find team member for this user
    const teamMember = await prisma.team_members.findFirst({
      where: {
        customer_id: customerId,
        user_id: userId,
        status: 'active',
      },
    });

    if (!teamMember) {
      return res.status(403).json({ error: 'You are not an active team member' });
    }

    // Get approval
    const approval = await prisma.invoice_approvals.findFirst({
      where: {
        id: approvalId,
        approver_id: teamMember.id,
      },
      include: {
        invoice: true,
      },
    });

    if (!approval) {
      return res.status(404).json({ error: 'Approval not found or not assigned to you' });
    }

    if (approval.status !== 'pending') {
      return res.status(400).json({ error: `Approval already ${approval.status}` });
    }

    // Update approval
    const updatedApproval = await prisma.invoice_approvals.update({
      where: { id: approvalId },
      data: {
        status: 'rejected',
        decision: 'rejected',
        comments,
        responded_at: new Date(),
      },
    });

    // Update invoice status
    await prisma.project_invoices.update({
      where: { id: approval.invoice_id },
      data: {
        status: 'rejected',
        notes: `Rejected by ${teamMember.first_name} ${teamMember.last_name}: ${comments}`,
      },
    });

    console.log(`❌ Invoice rejected: ${approval.invoice.invoiceNumber} by ${teamMember.first_name} ${teamMember.last_name}`);

    // Send notification to invoice creator
    try {
      const invoice = approval.invoice as any;
      if (invoice.created_by) {
        await notificationService.sendTemplatedNotification(
          'invoice_rejected',
          {
            requesterName: 'User',
            invoiceNumber: invoice.invoiceNumber || 'N/A',
            amount: `₦${(Number(invoice.amount) || 0).toLocaleString()}`,
            approverName: `${teamMember.first_name} ${teamMember.last_name}`,
            reason: reason || 'Not specified',
            comments: comments,
            actionUrl: `/invoices/${invoice.id}`,
          },
          {
            customerId,
            userId: invoice.created_by,
            type: 'invoice_rejected',
            sendEmail: true,
          }
        );
      }
    } catch (notifError) {
      console.error('Error sending rejection notification:', notifError);
      // Don't fail the rejection if notification fails
    }

    res.json({
      success: true,
      message: 'Invoice rejected',
      data: {
        approvalId: updatedApproval.id,
        status: updatedApproval.status,
        respondedAt: updatedApproval.responded_at,
        invoiceStatus: 'rejected',
      },
    });
  } catch (error) {
    console.error('Error rejecting invoice:', error);
    res.status(500).json({ error: 'Failed to reject invoice' });
  }
});

/**
 * GET /api/approvals/invoices/:invoiceId/history
 * Get approval history for an invoice
 */
router.get('/invoices/:invoiceId/history', authMiddleware, customerOnly, async (req: AuthRequest, res: Response) => {
  try {
    const customerId = req.user!.customerId;
    const { invoiceId } = req.params;

    // Verify invoice belongs to customer
    const invoice = await prisma.project_invoices.findFirst({
      where: {
        id: invoiceId,
        project: {
          customerId: customerId,
        },
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Get approval history
    const history = await prisma.approval_history.findMany({
      where: { invoice_id: invoiceId },
      orderBy: { created_at: 'desc' },
    });

    const transformedHistory = history.map(entry => ({
      id: entry.id,
      action: entry.action,
      actorName: entry.actor_name,
      actorRole: entry.actor_role,
      level: entry.level,
      comments: entry.comments,
      previousStatus: entry.previous_status,
      newStatus: entry.new_status,
      metadata: entry.metadata,
      createdAt: entry.created_at,
    }));

    res.json({ success: true, data: transformedHistory });
  } catch (error) {
    console.error('Error fetching approval history:', error);
    res.status(500).json({ error: 'Failed to fetch approval history' });
  }
});

/**
 * GET /api/approvals/stats
 * Get approval statistics
 */
router.get('/stats', authMiddleware, customerOnly, async (req: AuthRequest, res: Response) => {
  try {
    const customerId = req.user!.customerId;
    const { startDate, endDate } = req.query;

    const where: any = {
      invoice: {
        project: {
          customerId: customerId,
        },
      },
    };

    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at.gte = new Date(startDate as string);
      if (endDate) where.created_at.lte = new Date(endDate as string);
    }

    // Get all approvals in date range
    const approvals = await prisma.invoice_approvals.findMany({
      where,
      include: {
        approver: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Calculate statistics
    const totalApprovals = approvals.length;
    const approved = approvals.filter(a => a.status === 'approved').length;
    const rejected = approvals.filter(a => a.status === 'rejected').length;
    const pending = approvals.filter(a => a.status === 'pending').length;

    // Calculate average approval time (for approved ones)
    const approvedWithTime = approvals.filter(a =>
      a.status === 'approved' && a.responded_at && a.requested_at
    );
    const totalTime = approvedWithTime.reduce((sum, a) => {
      const hours = (a.responded_at!.getTime() - a.requested_at.getTime()) / (1000 * 60 * 60);
      return sum + hours;
    }, 0);
    const averageApprovalTime = approvedWithTime.length > 0
      ? totalTime / approvedWithTime.length
      : 0;

    // Group by level
    const byLevel: any = {};
    approvals.forEach(a => {
      if (!byLevel[a.level]) {
        byLevel[a.level] = {
          level: a.level,
          name: a.level_name || `Level ${a.level}`,
          approved: 0,
          rejected: 0,
          pending: 0,
          totalTime: 0,
          count: 0,
        };
      }
      byLevel[a.level][a.status]++;

      if (a.status === 'approved' && a.responded_at) {
        const hours = (a.responded_at.getTime() - a.requested_at.getTime()) / (1000 * 60 * 60);
        byLevel[a.level].totalTime += hours;
        byLevel[a.level].count++;
      }
    });

    const byLevelArray = Object.values(byLevel).map((level: any) => ({
      level: level.level,
      name: level.name,
      averageTime: level.count > 0 ? level.totalTime / level.count : 0,
      approved: level.approved,
      rejected: level.rejected,
      pending: level.pending,
    }));

    // Group by approver
    const byApprover: any = {};
    approvals.forEach(a => {
      if (!a.approver) return;

      const key = a.approver.id;
      if (!byApprover[key]) {
        byApprover[key] = {
          approver: `${a.approver.first_name} ${a.approver.last_name}`,
          role: a.approver.role.name,
          totalApprovals: 0,
          approved: 0,
          rejected: 0,
          pending: 0,
          totalTime: 0,
          count: 0,
        };
      }
      byApprover[key].totalApprovals++;
      byApprover[key][a.status]++;

      if (a.status === 'approved' && a.responded_at) {
        const hours = (a.responded_at.getTime() - a.requested_at.getTime()) / (1000 * 60 * 60);
        byApprover[key].totalTime += hours;
        byApprover[key].count++;
      }
    });

    const byApproverArray = Object.values(byApprover).map((approver: any) => ({
      approver: approver.approver,
      role: approver.role,
      totalApprovals: approver.totalApprovals,
      approved: approver.approved,
      rejected: approver.rejected,
      pending: approver.pending,
      averageTime: approver.count > 0 ? approver.totalTime / approver.count : 0,
    }));

    res.json({
      success: true,
      data: {
        totalApprovals,
        approved,
        rejected,
        pending,
        averageApprovalTime: Math.round(averageApprovalTime * 10) / 10,
        byLevel: byLevelArray,
        byApprover: byApproverArray,
      },
    });
  } catch (error) {
    console.error('Error fetching approval stats:', error);
    res.status(500).json({ error: 'Failed to fetch approval statistics' });
  }
});

export default router;

