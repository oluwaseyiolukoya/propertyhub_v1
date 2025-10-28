import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { emitToCustomer } from '../lib/socket';

const router = express.Router();

// Login - DATABASE ONLY (No mock authentication)
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password, userType } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Database authentication ONLY
    try {
      // Attempt ADMIN login first when explicitly requested or when no userType provided
      if (!userType || userType === 'admin') {
        console.log('🔍 Admin login attempt:', { email, userType });
        
        // First, try Super Admin table
        const admin = await prisma.admins.findUnique({ where: { email } });
        console.log('🔍 Super Admin found:', admin ? `Yes (${admin.email})` : 'No');
        
        if (admin) {
          const isValidPassword = await bcrypt.compare(password, admin.password);
          console.log('🔍 Super Admin password valid:', isValidPassword);
          
          if (!isValidPassword) {
            console.log('❌ Invalid password for Super Admin');
            return res.status(401).json({ error: 'Invalid credentials' });
          }

          // Block inactive super admins
          if (admin.isActive === false) {
            console.log('❌ Super Admin account inactive');
            return res.status(403).json({ error: 'Account is inactive' });
          }

          // Update last login for Super Admin
          try {
            await prisma.admins.update({
              where: { id: admin.id },
              data: { lastLogin: new Date() }
            });
          } catch (e) {
            console.warn('⚠️ Failed to update Super Admin lastLogin:', e);
          }

          const token = (jwt as any).sign(
            { id: admin.id, email: admin.email, role: admin.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
          );

          console.log('✅ Super Admin login successful');
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

        // If not Super Admin, try Internal Admin Users (customerId = null)
        console.log('🔍 Checking Internal Admin Users table...');
        const internalUser = await prisma.users.findUnique({ 
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

          // Block inactive or non-active internal admin users
          if (internalUser.isActive === false || (internalUser.status && internalUser.status !== 'active')) {
            console.log('❌ Internal Admin account inactive');
            return res.status(403).json({ error: 'Account is inactive' });
          }

          // Update last login
          await prisma.users.update({
            where: { id: internalUser.id },
            data: { lastLogin: new Date() }
          });

          const token = (jwt as any).sign(
            { id: internalUser.id, email: internalUser.email, role: internalUser.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
          );

          console.log('✅ Internal Admin User login successful');
          return res.json({
            token,
            user: {
              id: internalUser.id,
              email: internalUser.email,
              name: internalUser.name,
              role: internalUser.role,
              userType: 'admin'
            }
          });
        }

        // If userType was explicitly admin and not found, fail here
        if (userType === 'admin') {
          console.log('❌ Admin not found in any table (explicit admin login)');
          return res.status(401).json({ error: 'Invalid credentials' });
        }
      }

      // CUSTOMER USERS (owner, manager, tenant)
      const user = await prisma.users.findUnique({
        where: { email },
        include: { customers: true }
      });

      if (!user || !user.password) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Block inactive or non-active customer users
      if (user.isActive === false || (user.status && user.status !== 'active')) {
        return res.status(403).json({ error: 'Account is inactive' });
      }

      // Update last login
      await prisma.users.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });

      // Derive userType from database, not from request
      // Internal admins are handled above; here customerId is not null
      const roleLower = (user.role || '').toLowerCase();
      const derivedUserType = roleLower === 'owner' || roleLower === 'property-owner' 
        ? 'owner'
        : roleLower === 'manager' || roleLower === 'property-manager'
          ? 'manager'
          : roleLower === 'tenant'
            ? 'tenant'
            : 'owner'; // default to owner for customer users

      const token = (jwt as any).sign(
        { id: user.id, email: user.email, role: user.role, customerId: user.customerId },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      return res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          userType: derivedUserType,
          customerId: user.customerId,
          customer: user.customers
        }
      });
    } catch (dbError) {
      // Database error - log and return generic error
      console.error('❌ Database authentication error:', dbError);
      return res.status(500).json({ error: 'Authentication service unavailable. Please try again later.' });
    }

  } catch (error: any) {
    console.error('❌ Login error:', error);
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
    const user = await prisma.users.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.password) {
      return res.status(400).json({ error: 'Password already set' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.users.update({
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

// Validate session - check if user's account is still valid and role hasn't changed
router.get('/validate-session', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    // Prevent any caching for session validation
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    const tokenUser = req.user;

    if (!tokenUser) {
      return res.status(401).json({ 
        valid: false,
        reason: 'Not authenticated',
        forceLogout: true 
      });
    }

    // 1) Check Super Admins table
    const admin = await prisma.admins.findUnique({
      where: { id: tokenUser.id },
      select: { isActive: true }
    });

    if (admin) {
      if (!admin.isActive) {
        return res.status(403).json({
          valid: false,
          reason: 'Your account has been deactivated',
          forceLogout: true
        });
      }
      // Super admins are valid if active
      return res.json({ valid: true });
    }

    // 2) Check Users table (internal admins and customer users)
    const dbUser = await prisma.users.findUnique({
      where: { id: tokenUser.id },
      select: { 
        role: true,
        isActive: true,
        status: true,
        customerId: true
      }
    });

    if (!dbUser) {
      return res.status(401).json({ 
        valid: false,
        reason: 'User not found',
        forceLogout: true 
      });
    }

    // Internal admin user (customerId is null)
    if (dbUser.customerId === null) {
      if (!dbUser.isActive) {
        return res.status(403).json({ 
          valid: false,
          reason: 'Your account has been deactivated',
          forceLogout: true 
        });
      }
      // Internal admins: treat as valid if active (no role/permissions compare)
      return res.json({ valid: true });
    }

    // Customer user (owner/manager/tenant)
    if (!dbUser.isActive || dbUser.status !== 'active') {
      return res.status(403).json({ 
        valid: false,
        reason: 'Your account has been deactivated',
        forceLogout: true 
      });
    }

    // Check role mismatch for customer users only
    if (dbUser.role !== tokenUser.role) {
      console.log(`⚠️ Role mismatch for user ${tokenUser.id}: Token=${tokenUser.role}, DB=${dbUser.role}`);
      return res.status(403).json({ 
        valid: false,
        reason: `Your role has been changed to ${dbUser.role}. Please log in again.`,
        forceLogout: true 
      });
    }

    return res.json({ valid: true });

  } catch (error: any) {
    console.error('Session validation error:', error);
    return res.status(500).json({ error: 'Failed to validate session' });
  }
});

// Get current user's account/customer info (for owners/managers to see updated limits and plan)
router.get('/account', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // If token belongs to Super Admin, return admin account info
    const admin = await prisma.admins.findUnique({ where: { id: userId } });
    if (admin) {
      return res.json({
        user: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          status: admin.isActive ? 'active' : 'inactive'
        },
        customer: null
      });
    }

    // Fetch user with customer details (internal admin users and customer users)
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        customers: {
          include: {
            plans: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return relevant account information
    const customer = (user as any).customers || null;
    const plan = customer?.plans || null;

    // Derive userType from role (same logic as login)
    const roleLower = (user.role || '').toLowerCase();
    const derivedUserType = roleLower === 'owner' || roleLower === 'property-owner' || roleLower === 'property owner'
      ? 'owner'
      : roleLower === 'manager' || roleLower === 'property-manager' || roleLower === 'property manager'
        ? 'manager'
        : roleLower === 'tenant'
          ? 'tenant'
          : user.customerId ? 'owner' : 'admin'; // default to owner for customer users, admin for internal

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        baseCurrency: user.baseCurrency || 'USD', // Include baseCurrency for multi-currency support
        customerId: user.customerId, // Add customerId so frontend can determine internal vs customer user
        userType: derivedUserType // Add userType so frontend knows which dashboard to show
      },
      customer: customer ? {
        id: customer.id,
        company: customer.company,
        owner: customer.owner,
        email: customer.email,
        phone: customer.phone,
        website: customer.website,
        // Address fields for owner profile autofill
        street: customer.street,
        city: customer.city,
        state: customer.state,
        postalCode: customer.postalCode,
        country: customer.country,
        // Alias for frontend code expecting zipCode
        zipCode: customer.postalCode,
        status: customer.status,
        billingCycle: customer.billingCycle,
        propertyLimit: customer.propertyLimit,
        userLimit: customer.userLimit,
        storageLimit: customer.storageLimit,
        propertiesCount: customer.propertiesCount,
        unitsCount: customer.unitsCount,
        subscriptionStartDate: customer.subscriptionStartDate,
        trialEndsAt: customer.trialEndsAt,
        plan: plan ? {
          name: plan.name,
          description: plan.description,
          monthlyPrice: plan.monthlyPrice,
          annualPrice: plan.annualPrice,
          currency: plan.currency,
          features: plan.features
        } : null
      } : null
    });

  } catch (error: any) {
    console.error('Get account error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Owner/Manager self-service account update (no admin required)
router.put('/account', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const tokenCustomerId = (req.user as any)?.customerId || null;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const customerId = tokenCustomerId || user.customerId;
    if (!customerId) {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const {
      owner,
      phone,
      street,
      city,
      state,
      zipCode,
      postalCode,
      country,
      company,
      taxId,
      website,
      industry,
      companySize
    } = req.body || {};

    const customerData: any = {};
    if (typeof owner === 'string') customerData.owner = owner;
    if (typeof phone === 'string') customerData.phone = phone;
    if (typeof street === 'string') customerData.street = street;
    if (typeof city === 'string') customerData.city = city;
    if (typeof state === 'string') customerData.state = state;
    const resolvedPostal = (postalCode ?? zipCode);
    if (typeof resolvedPostal === 'string') customerData.postalCode = resolvedPostal;
    if (typeof country === 'string') customerData.country = country;
    if (typeof company === 'string') customerData.company = company;
    if (typeof taxId === 'string') customerData.taxId = taxId;
    if (typeof website === 'string') customerData.website = website;
    if (typeof industry === 'string') customerData.industry = industry;
    if (typeof companySize === 'string') customerData.companySize = companySize;

    const updatedCustomer = await prisma.customers.update({
      where: { id: customerId },
      data: customerData,
      include: { plans: true }
    });

    try {
      if (owner || phone) {
        await prisma.users.updateMany({
          where: { customerId, role: 'owner' },
          data: {
            ...(owner && { name: owner }),
            ...(phone && { phone })
          }
        });
      }
    } catch (e) {
      console.warn('Owner sync warn:', e);
    }

    try {
      emitToCustomer(customerId, 'account:updated', { customer: updatedCustomer });
    } catch {}

    return res.json({ success: true, customer: updatedCustomer });
  } catch (error: any) {
    console.error('Update account error:', error);
    return res.status(500).json({ error: 'Failed to update account' });
  }
});

export default router;


