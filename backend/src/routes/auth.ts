import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Mock users for development (when database is not connected)
const mockUsers = {
  admin: {
    id: 'admin-1',
    email: 'admin@propertyhub.com',
    password: 'admin123',
    name: 'Super Admin',
    role: 'admin',
    userType: 'admin'
  },
  owner: {
    id: 'owner-1',
    email: 'john@metro-properties.com',
    password: 'owner123',
    name: 'John Smith',
    role: 'owner',
    userType: 'owner',
    customerId: 'customer-1',
    customer: {
      id: 'customer-1',
      company: 'Metro Properties LLC',
      owner: 'John Smith'
    }
  },
  manager: {
    id: 'manager-1',
    email: 'sarah@propertyhub.com',
    password: 'manager123',
    name: 'Sarah Johnson',
    role: 'manager',
    userType: 'manager',
    customerId: 'customer-1',
    customer: {
      id: 'customer-1',
      company: 'Metro Properties LLC',
      owner: 'John Smith'
    }
  },
  tenant: {
    id: 'tenant-1',
    email: 'mike@email.com',
    password: 'tenant123',
    name: 'Mike Wilson',
    role: 'tenant',
    userType: 'tenant',
    customerId: 'customer-1',
    customer: {
      id: 'customer-1',
      company: 'Metro Properties LLC',
      owner: 'John Smith'
    }
  }
};

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password, userType } = req.body;

    if (!email || !password || !userType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Try mock authentication first (for development)
    const mockUser = Object.values(mockUsers).find(u => u.email === email && u.userType === userType);
    if (mockUser && mockUser.password === password) {
      console.log('✅ Mock authentication successful for:', email);
      
      const token = jwt.sign(
        { id: mockUser.id, email: mockUser.email, role: mockUser.role, customerId: mockUser.customerId },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      const { password: _, ...userWithoutPassword } = mockUser;
      
      return res.json({
        token,
        user: userWithoutPassword
      });
    }

    // Try database authentication
    try {
      // For admin (checks both Super Admin and Internal Admin Users)
      if (userType === 'admin') {
        console.log('🔍 Admin login attempt:', { email, userType });
        
        // First, try Super Admin table
        const admin = await prisma.admin.findUnique({ where: { email } });
        console.log('🔍 Super Admin found:', admin ? `Yes (${admin.email})` : 'No');
        
        if (admin) {
          const isValidPassword = await bcrypt.compare(password, admin.password);
          console.log('🔍 Super Admin password valid:', isValidPassword);
          
          if (!isValidPassword) {
            console.log('❌ Invalid password for Super Admin');
            return res.status(401).json({ error: 'Invalid credentials' });
          }

          // Fetch Super Admin role permissions
          const superAdminRole = await prisma.role.findUnique({
            where: { name: 'Super Admin' }
          });

          const token = jwt.sign(
            { id: admin.id, email: admin.email, role: admin.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
          );

          console.log('✅ Super Admin login successful');
          return res.json({
            token,
            user: {
              id: admin.id,
              email: admin.email,
              name: admin.name,
              role: admin.role,
              userType: 'admin',
              permissions: superAdminRole?.permissions || [],
              rolePermissions: superAdminRole?.permissions || [],
              isSuperAdmin: true
            }
          });
        }

        // If not Super Admin, try Internal Admin Users (customerId = null)
        console.log('🔍 Checking Internal Admin Users table...');
        const internalUser = await prisma.user.findUnique({ 
          where: { email }
        });
        console.log('🔍 Internal Admin User found:', internalUser ? `Yes (${internalUser.email})` : 'No');
        
        if (internalUser && internalUser.customerId === null) {
          const isValidPassword = await bcrypt.compare(password, internalUser.password);
          console.log('🔍 Internal Admin password valid:', isValidPassword);
          
          if (!isValidPassword) {
            console.log('❌ Invalid password for Internal Admin User');
            return res.status(401).json({ error: 'Invalid credentials' });
          }

          // Update last login
          await prisma.user.update({
            where: { id: internalUser.id },
            data: { lastLogin: new Date() }
          });

          // Fetch role permissions for internal admin user
          const userRole = await prisma.role.findUnique({
            where: { name: internalUser.role }
          });

          const token = jwt.sign(
            { id: internalUser.id, email: internalUser.email, role: internalUser.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
          });

          console.log('✅ Internal Admin User login successful');
          return res.json({
            token,
            user: {
              id: internalUser.id,
              email: internalUser.email,
              name: internalUser.name,
              role: internalUser.role,
              userType: 'admin',
              permissions: internalUser.permissions || userRole?.permissions || [],
              rolePermissions: userRole?.permissions || [],
              department: internalUser.department,
              company: internalUser.company
            }
          });
        }

        // Neither Super Admin nor Internal Admin User found
        console.log('❌ Admin not found in any table');
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // For other user types (owner, manager, tenant)
      const user = await prisma.user.findUnique({
        where: { email },
        include: { customer: true }
      });

      if (!user || !user.password) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });

      // Fetch role permissions
      const userRole = await prisma.role.findUnique({
        where: { name: user.role === 'owner' ? 'Property Owner' : user.role === 'manager' ? 'Property Manager' : 'Tenant' }
      });

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, customerId: user.customerId },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      return res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          userType: userType,
          customerId: user.customerId,
          customer: user.customer,
          permissions: user.permissions || userRole?.permissions || [],
          rolePermissions: userRole?.permissions || []
        }
      });
    } catch (dbError) {
      // Database not available, already tried mock auth
      console.error('Database error (falling back to mock failed):', dbError);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed' });
  }
});

// Setup password (for new users via invitation)
router.post('/setup-password', async (req: Request, res: Response) => {
  try {
    const { email, password, token } = req.body;

    if (!email || !password || !token) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify invitation token (simplified for now)
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.password) {
      return res.status(400).json({ error: 'Password already set' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        status: 'active',
        acceptedAt: new Date()
      }
    });

    return res.json({ message: 'Password set successfully' });

  } catch (error: any) {
    console.error('Setup password error:', error);
    return res.status(500).json({ error: 'Failed to setup password' });
  }
});

// Verify token
router.get('/verify', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;

    return res.json({ valid: true, user: decoded });

  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

// Get current user's account/customer info (for owners/managers to see updated limits and plan)
router.get('/account', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Fetch user with customer details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        customer: {
          include: {
            plan: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return relevant account information
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      },
      customer: user.customer ? {
        id: user.customer.id,
        company: user.customer.company,
        owner: user.customer.owner,
        email: user.customer.email,
        phone: user.customer.phone,
        website: user.customer.website,
        status: user.customer.status,
        billingCycle: user.customer.billingCycle,
        propertyLimit: user.customer.propertyLimit,
        userLimit: user.customer.userLimit,
        storageLimit: user.customer.storageLimit,
        propertiesCount: user.customer.propertiesCount,
        unitsCount: user.customer.unitsCount,
        subscriptionStartDate: user.customer.subscriptionStartDate,
        trialEndsAt: user.customer.trialEndsAt,
        plan: user.customer.plan ? {
          name: user.customer.plan.name,
          description: user.customer.plan.description,
          monthlyPrice: user.customer.plan.monthlyPrice,
          annualPrice: user.customer.plan.annualPrice,
          currency: user.customer.plan.currency,
          features: user.customer.plan.features
        } : null
      } : null
    });

  } catch (error: any) {
    console.error('Get account error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

export default router;


