import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { authMiddleware, adminOnly, AuthRequest } from '../middleware/auth';
import prisma from '../lib/db';
import { emitToAdmins, forceUserReauth } from '../lib/socket';
import { v4 as uuidv4 } from 'uuid';
import { sendInternalAdminCredentials } from '../lib/email';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);
router.use(adminOnly);

// Mock data for development (INTERNAL ADMIN USERS ONLY)
const mockUsers = [
  {
    id: 'admin-1',
    name: 'Admin User',
    email: 'admin@contrezz.com',
    role: 'admin',
    status: 'active',
    customerId: null, // Internal admin user, not associated with a customer
    customer: null,
    department: 'Administration',
    lastLogin: new Date(),
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'admin-2',
    name: 'Support Staff',
    email: 'support@contrezz.com',
    role: 'admin',
    status: 'active',
    customerId: null, // Internal admin user
    customer: null,
    department: 'Customer Support',
    lastLogin: new Date(),
    createdAt: new Date('2024-01-05')
  }
];

// Get all users (combines Super Admins from admins table and internal users from users table)
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { search, status, role, customerId } = req.query;

    // Try database first
    try {
      // All internal admin users are in the users table with customerId = null
      const where: any = {
        customerId: null // ONLY internal admin users (not associated with customers)
      };

      if (search) {
        where.OR = [
          { name: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
          { company: { contains: search as string, mode: 'insensitive' } },
          { department: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      if (status) {
        where.status = status;
      }

      if (role) {
        where.role = role;
      }

      const internalUsers = await prisma.users.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      });

      // Remove passwords and add isSuperAdmin flag based on role
      // IMPORTANT: Only Super Admin users should have isSuperAdmin = true
      // Regular Admin users should NOT have this flag, so they can be edited/deleted by other admins
      const usersWithoutPassword = internalUsers.map(({ password, ...user }) => {
        const roleLower = user.role?.toLowerCase() || '';
        // Only true Super Admins should be protected from editing/deletion
        const isSuperAdmin =
          roleLower === 'super_admin' ||
          roleLower === 'super admin' ||
          roleLower === 'superadmin';

        return {
          ...user,
          isSuperAdmin
        };
      });

      console.log('✅ Internal admin users fetched:', usersWithoutPassword.length);

      return res.json(usersWithoutPassword);
    } catch (dbError: any) {
      // Database not available, return mock data
      console.log('📝 Using mock internal admin users data');
      return res.json(mockUsers);
    }

  } catch (error: any) {
    console.error('Get users error:', error);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get single user
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.users.findUnique({
      where: { id },
      include: {
        customers: true,
        properties: {
          select: {
            id: true,
            name: true,
            propertyType: true,
            status: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password, ...userWithoutPassword } = user;

    return res.json(userWithoutPassword);

  } catch (error: any) {
    console.error('Get user error:', error);
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Create user (INTERNAL ADMIN USER ONLY - for User Management)
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      email,
      phone,
      role,
      department,
      company,
      permissions,
      isActive,
      sendInvite
    } = req.body;

    // Validate required fields
    if (!name || !email || !role) {
      return res.status(400).json({ error: 'Missing required fields: name, email, role' });
    }

    // Log the incoming request for debugging
    console.log('📥 Creating internal admin user:', {
      email,
      name,
      role,
      sendInvite: sendInvite !== undefined ? sendInvite : 'undefined (will default to false)',
      sendInviteType: typeof sendInvite,
      isActive: isActive !== undefined ? isActive : 'undefined (will default to true)'
    });

    // For internal admin users, default sendInvite to false if not provided
    // This ensures credentials are always sent unless explicitly requested otherwise
    // IMPORTANT: Only treat as true if explicitly set to boolean true or string 'true'
    // This prevents any falsy values (undefined, null, false, 0, '') from being treated as true
    const shouldSendInvite = sendInvite === true || sendInvite === 'true';

    // Log the decision for debugging
    console.log('🔍 sendInvite decision:', {
      received: sendInvite,
      type: typeof sendInvite,
      shouldSendInvite,
      willSendCredentials: !shouldSendInvite,
      action: !shouldSendInvite ? '✅ WILL SEND CREDENTIALS' : '❌ WILL CREATE AS PENDING (NO EMAIL)'
    });

    // Check if email already exists in users table
    const existingUser = await prisma.users.findUnique({ where: { email } });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Generate temporary password if not sending invite
    const tempPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10).toUpperCase();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    let user;
    try {
      user = await prisma.users.create({
        data: {
          id: uuidv4(),
          customerId: null, // INTERNAL ADMIN USER - not associated with any customer
          name,
          email,
          password: shouldSendInvite ? null : hashedPassword,
          phone,
          role: role || 'admin', // Default to admin role for internal users
          department,
          company: company || 'Contrezz Admin', // Internal admin company
          permissions,
          // Always set isActive to true for new internal admin users (they should be able to login immediately)
          isActive: true,
          // If sending invite, status is 'pending', otherwise 'active' (so they can login immediately)
          status: shouldSendInvite ? 'pending' : 'active',
          invitedAt: shouldSendInvite ? new Date() : null
        }
      });
    } catch (e: any) {
      console.error('❌ Failed to create internal user:', e);
      if (e?.code === 'P2002') {
        return res.status(400).json({ error: 'Email already exists' });
      }
      return res.status(500).json({ error: 'Failed to create user' });
    }

    console.log('✅ Internal admin user created:', user.email);
    console.log('📊 User status:', user.status, '| isActive:', user.isActive, '| Has password:', !!user.password);
    console.log('📧 Send invite was:', shouldSendInvite, '| Will send credentials:', !shouldSendInvite);

    // Note: No activity log for internal users since they don't belong to a customer

    // CRITICAL: Always send credentials email for internal admin users unless explicitly set to send invite
    // This is a safeguard to ensure users can always login immediately
    if (!shouldSendInvite) {
      console.log('📧 Preparing to send credentials email...');
      // Ensure user is active and status is 'active' when credentials are sent
      // This is a safeguard in case the user was created with wrong status
      if (user.status !== 'active' || !user.isActive) {
        console.log('⚠️ Fixing user status/active state for immediate login...');
        await prisma.users.update({
          where: { id: user.id },
          data: {
            isActive: true,
            status: 'active'
          }
        });
        user.isActive = true;
        user.status = 'active';
        console.log('✅ User status fixed:', user.status, '| isActive:', user.isActive);
      }
      try {
        console.log('📧 Calling sendInternalAdminCredentials for:', email);
        console.log('📧 Email parameters:', {
          adminName: name,
          adminEmail: email,
          role: role || 'admin',
          department: department || 'N/A',
          hasTempPassword: !!tempPassword
        });

        const emailSent = await sendInternalAdminCredentials({
          adminName: name,
          adminEmail: email,
          tempPassword: tempPassword,
          role: role || 'admin',
          department: department,
          isPasswordReset: false
        });

        if (emailSent) {
          console.log('✅ Login credentials email sent successfully to:', email);
          console.log('📬 Temporary password generated (first 4 chars):', tempPassword.substring(0, 4) + '****');
        } else {
          console.warn('⚠️ Failed to send login credentials email to:', email);
          console.warn('⚠️ Email function returned false - check SMTP configuration');
          console.warn('⚠️ User can still login with password:', tempPassword.substring(0, 4) + '****');
        }
      } catch (emailError: any) {
        console.error('❌ Error sending login credentials email:', emailError);
        console.error('❌ Error details:', {
          message: emailError?.message,
          code: emailError?.code,
          stack: emailError?.stack?.substring(0, 200)
        });
        console.warn('⚠️ User created but email failed. Password:', tempPassword.substring(0, 4) + '****');
        // Don't fail user creation if email fails, but log it clearly
      }
    } else {
      console.log('⚠️ User created with sendInvite=true - NO credentials email will be sent');
      console.log('⚠️ User status is "pending" - they cannot login until password is set');
      console.log('⚠️ Use "Reset Password" action to generate password and send credentials');
    }

    const { password, ...userWithoutPassword } = user;

    // Emit real-time event to all admins
    emitToAdmins('user:created', {
      user: userWithoutPassword
    });

    // Build response with email status
    const response: any = {
      ...userWithoutPassword,
    };

    // Include tempPassword if credentials were sent (so admin can manually share if email fails)
    if (!shouldSendInvite) {
      response.tempPassword = tempPassword;
      response.emailSent = true; // Indicate that email was attempted
    } else {
      response.emailSent = false; // No email sent for invites
    }

    return res.status(201).json(response);

  } catch (error: any) {
    console.error('Create user error:', error);
    return res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user (INTERNAL ADMIN USER ONLY)
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      role,
      department,
      company,
      permissions,
      isActive,
      status
    } = req.body;

    // Get existing user to check if role/permissions changed
    const existingUser = await prisma.users.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = await prisma.users.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        role,
        department,
        company,
        permissions,
        isActive,
        status
      }
    });

    console.log('✅ Internal admin user updated:', user.email);

    // Check if role or permissions changed - if so, force re-authentication
    const roleChanged = role && role !== existingUser.role;
    const permissionsChanged = permissions && JSON.stringify(permissions) !== JSON.stringify(existingUser.permissions);
    const statusChanged = isActive !== undefined && isActive !== existingUser.isActive;

    if (roleChanged || permissionsChanged || statusChanged) {
      let reason = 'Your account settings have been updated';
      if (roleChanged) {
        reason = `Your role has been changed from ${existingUser.role} to ${role}`;
      } else if (statusChanged && !isActive) {
        reason = 'Your account has been deactivated';
      } else if (permissionsChanged) {
        reason = 'Your permissions have been updated';
      }

      // Force user to re-authenticate
      forceUserReauth(id, reason);
      console.log(`🔐 Forcing re-auth for user ${user.email} - ${reason}`);
    }

    // Note: No activity log for internal users since they don't belong to a customer

    const { password, ...userWithoutPassword } = user;

    // Emit real-time event to all admins
    emitToAdmins('user:updated', {
      user: userWithoutPassword
    });

    return res.json(userWithoutPassword);

  } catch (error: any) {
    console.error('Update user error:', error);
    return res.status(500).json({ error: 'Failed to update user' });
  }
});

// Reset password for internal user
router.post('/:id/reset-password', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Find the user
    const user = await prisma.users.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate a new temporary password
    const tempPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10).toUpperCase();

    // Hash the password
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Update user's password in the database
    await prisma.users.update({
      where: { id },
      data: {
        password: hashedPassword
      }
    });

    console.log('✅ Password reset for internal user:', user.email);

    // Send password reset email with new credentials
    try {
      const emailSent = await sendInternalAdminCredentials({
        adminName: user.name || 'Admin',
        adminEmail: user.email,
        tempPassword: tempPassword,
        role: user.role || 'admin',
        department: user.department || undefined,
        isPasswordReset: true
      });

      if (emailSent) {
        console.log('✅ Password reset email sent to:', user.email);
        return res.json({
          message: 'Password reset successfully. Email sent to user.',
          tempPassword: tempPassword,
          emailSent: true
        });
      } else {
        console.warn('⚠️ Failed to send password reset email to:', user.email);
        return res.json({
          message: 'Password reset successfully, but email failed to send',
          tempPassword: tempPassword,
          emailSent: false
        });
      }
    } catch (emailError: any) {
      console.error('❌ Error sending password reset email:', emailError);
      // Return temp password if email fails
      return res.json({
        message: 'Password reset successfully, but email failed to send',
        tempPassword: tempPassword,
        emailSent: false
      });
    }

  } catch (error: any) {
    console.error('Reset password error:', error);
    return res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Resend login credentials email to internal user
router.post('/:id/resend-credentials', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Find the user
    const user = await prisma.users.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user has a password (not pending invite)
    if (!user.password) {
      return res.status(400).json({
        error: 'User does not have a password set. This user may be pending invitation.'
      });
    }

    // Generate a new temporary password
    const tempPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10).toUpperCase();

    // Hash the password
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Update user's password in the database
    await prisma.users.update({
      where: { id },
      data: {
        password: hashedPassword
      }
    });

    console.log('✅ Password reset for resending credentials to:', user.email);

    // Send credentials email
    try {
      const emailSent = await sendInternalAdminCredentials({
        adminName: user.name || 'Admin',
        adminEmail: user.email,
        tempPassword: tempPassword,
        role: user.role || 'admin',
        department: user.department || undefined,
        isPasswordReset: false
      });

      if (emailSent) {
        console.log('✅ Login credentials email sent to:', user.email);
        return res.json({
          message: 'Login credentials email sent successfully.',
          emailSent: true,
          email: user.email
        });
      } else {
        console.warn('⚠️ Failed to send login credentials email to:', user.email);
        return res.json({
          message: 'Email failed to send. Please check SMTP configuration.',
          tempPassword: tempPassword,
          emailSent: false,
          email: user.email
        });
      }
    } catch (emailError: any) {
      console.error('❌ Error sending login credentials email:', emailError);
      return res.json({
        message: 'Email failed to send. Please check SMTP configuration.',
        tempPassword: tempPassword,
        emailSent: false,
        email: user.email,
        error: emailError.message
      });
    }

  } catch (error: any) {
    console.error('Resend credentials error:', error);
    return res.status(500).json({ error: 'Failed to resend credentials' });
  }
});

// Delete user (INTERNAL ADMIN USER ONLY)
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.users.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await prisma.users.delete({ where: { id } });

    console.log('✅ Internal admin user deleted:', user.email);

    // Note: No activity log for internal users since they don't belong to a customer

    // Emit real-time event to all admins
    emitToAdmins('user:deleted', {
      userId: id
    });

    return res.json({ message: 'User deleted successfully' });

  } catch (error: any) {
    console.error('Delete user error:', error);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;


