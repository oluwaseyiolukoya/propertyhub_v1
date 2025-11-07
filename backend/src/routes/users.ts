import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { authMiddleware, adminOnly, AuthRequest } from '../middleware/auth';
import prisma from '../lib/db';
import { emitToAdmins, forceUserReauth } from '../lib/socket';
import { v4 as uuidv4 } from 'uuid';

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
      // Fetch Super Admins from admins table
      const admins = await prisma.admins.findMany({
        orderBy: { createdAt: 'desc' }
      });

      // Fetch internal users from users table (where customerId is null)
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

      // Transform admins to match user structure
      const transformedAdmins = admins.map(admin => ({
        id: admin.id,
        customerId: null,
        name: admin.name,
        email: admin.email,
        phone: admin.phone || '',
        role: 'Super Admin', // Distinguish from regular admin users
        department: 'Administration',
        company: 'Contrezz Admin',
        isActive: true,
        status: 'active',
        lastLogin: admin.lastLogin,
        invitedAt: null,
        acceptedAt: null,
        permissions: [],
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
        isSuperAdmin: true // Flag to identify super admins
      }));

      // Remove passwords from internal users
      const usersWithoutPassword = internalUsers.map(({ password, ...user }) => ({
        ...user,
        isSuperAdmin: false
      }));

      // Combine both lists
      const allUsers = [...transformedAdmins, ...usersWithoutPassword];

      // Apply search filter to super admins if needed
      let filteredUsers = allUsers;
      if (search) {
        const searchLower = (search as string).toLowerCase();
        filteredUsers = allUsers.filter(user =>
          user.name.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower) ||
          (user.department && user.department.toLowerCase().includes(searchLower)) ||
          (user.company && user.company.toLowerCase().includes(searchLower))
        );
      }

      console.log('✅ Users fetched:', {
        superAdmins: transformedAdmins.length,
        internalUsers: usersWithoutPassword.length,
        total: filteredUsers.length
      });

      return res.json(filteredUsers);
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

    // Check if email already exists in users or admins
    const [existingUser, existingAdmin] = await Promise.all([
      prisma.users.findUnique({ where: { email } }),
      prisma.admins.findUnique({ where: { email } })
    ]);

    if (existingUser || existingAdmin) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Generate temporary password if not sending invite
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-2).toUpperCase();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    let user;
    try {
      user = await prisma.users.create({
        data: {
        id: uuidv4(),
        customerId: null, // INTERNAL ADMIN USER - not associated with any customer
        name,
        email,
        password: sendInvite ? null : hashedPassword,
        phone,
        role: role || 'admin', // Default to admin role for internal users
        department,
        company: company || 'Contrezz Admin', // Internal admin company
        permissions,
        isActive: isActive !== undefined ? isActive : true,
        status: sendInvite ? 'pending' : 'active',
        invitedAt: sendInvite ? new Date() : null
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

    // Note: No activity log for internal users since they don't belong to a customer

    // TODO: Send invitation email if sendInvite is true

    const { password, ...userWithoutPassword } = user;

    // Emit real-time event to all admins
    emitToAdmins('user:created', {
      user: userWithoutPassword
    });

    return res.status(201).json({
      ...userWithoutPassword,
      ...(!sendInvite && { tempPassword })
    });

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

    // Return the temporary password (for admin to give to user)
    return res.json({
      message: 'Password reset successfully',
      tempPassword: tempPassword
    });

  } catch (error: any) {
    console.error('Reset password error:', error);
    return res.status(500).json({ error: 'Failed to reset password' });
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


