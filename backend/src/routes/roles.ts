import express, { Response } from 'express';
import { authMiddleware, adminOnly, AuthRequest } from '../middleware/auth';
import prisma from '../lib/db';

const router = express.Router();

router.use(authMiddleware);
router.use(adminOnly);

// Get all roles
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const roles = await prisma.roles.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.json(roles);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

// Create role
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, permissions, isActive } = req.body;

    console.log('📝 Creating role with data:', { name, description, permissions, isActive });

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Generate unique ID
    const id = `ROLE${Date.now()}`;
    const now = new Date();

    // Normalize & validate permissions payload to be an array of strings
    let normalizedPermissions: string[] = [];
    if (Array.isArray(permissions)) {
      normalizedPermissions = Array.from(
        new Set(
          permissions
            .filter((p: any) => typeof p === 'string' && p.trim().length > 0)
            .map((p: string) => p.trim())
        )
      );
    }

    const role = await prisma.roles.create({
      data: {
        id,
        name,
        description: description || '',
        permissions: normalizedPermissions,
        isActive: isActive !== undefined ? isActive : true,
        isSystem: false,
        createdAt: now,
        updatedAt: now
      }
    });

    console.log('✅ Role created successfully:', role);
    return res.status(201).json(role);
  } catch (error: any) {
    console.error('❌ Error creating role:', error);
    // Handle Prisma known errors gracefully (e.g., unique constraint on name)
    if (error?.code === 'P2002') {
      return res.status(400).json({ error: 'Role name already exists. Choose a different name.' });
    }
    return res.status(500).json({ error: 'Failed to create role', details: error?.message || String(error) });
  }
});

// Update role
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, permissions, isActive } = req.body;

    const role = await prisma.roles.update({
      where: { id },
      data: {
        name,
        description,
        permissions,
        isActive,
        updatedAt: new Date()
      }
    });

    return res.json(role);
  } catch (error: any) {
    console.error('❌ Error updating role:', error);
    return res.status(500).json({ error: 'Failed to update role', details: error.message });
  }
});

// Delete role
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const role = await prisma.roles.findUnique({ where: { id } });

    if (role?.isSystem) {
      return res.status(400).json({ error: 'Cannot delete system role' });
    }

    await prisma.roles.delete({ where: { id } });

    return res.json({ message: 'Role deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to delete role' });
  }
});

export default router;


