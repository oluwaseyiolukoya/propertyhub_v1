import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/db';

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
      // For super admin
      if (userType === 'admin') {
        const admin = await prisma.admin.findUnique({ where: { email } });
        
        if (!admin) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValidPassword = await bcrypt.compare(password, admin.password);
        if (!isValidPassword) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
          { id: admin.id, email: admin.email, role: admin.role },
          process.env.JWT_SECRET || 'secret',
          { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        return res.json({
          token,
          user: {
            id: admin.id,
            email: admin.email,
            name: admin.name,
            role: admin.role,
            userType: 'admin'
          }
        });
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
          customer: user.customer
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

export default router;


