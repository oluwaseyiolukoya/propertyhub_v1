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

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const role = await prisma.roles.create({
      data: {
        name,
        description,
        permissions: permissions || [],
        isActive: isActive !== undefined ? isActive : true
      }
    });

    return res.status(201).json(role);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to create role' });
  }
});

// Update role
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, permissions, isActive } = req.body;

    const role = await prisma.roles.update({
      where: { id },
      data: { name, description, permissions, isActive }
    });

    return res.json(role);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to update role' });
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


