import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const itemSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  tags: z.array(z.string()).optional(),
  photo_urls: z.array(z.string()).optional(),
  serial_number: z.string().optional(),
  price_per_day: z.number().min(0),
  deposit_amount: z.number().min(0),
  condition_checklist: z.any().optional(),
  city: z.string().min(1),
  area: z.string().min(1),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = itemSchema.parse(req.body);
    const item = await prisma.item.create({
      data: {
        ...data,
        owner_id: req.user!.id,
      }
    });
    res.json(item);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: (error as any).errors[0].message });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, search, area } = req.query;
    
    const where: any = { is_available: true };
    
    if (category) {
      where.category = String(category);
    }
    if (area) {
      where.area = { contains: String(area), mode: 'insensitive' };
    }
    if (search) {
      where.OR = [
        { title: { contains: String(search), mode: 'insensitive' } },
        { description: { contains: String(search), mode: 'insensitive' } }
      ];
    }

    const items = await prisma.item.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true } }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const item = await prisma.item.findUnique({
      where: { id: String(req.params.id) },
      include: {
        owner: { select: { id: true, name: true } }
      }
    });
    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const item = await prisma.item.findUnique({ where: { id: String(req.params.id) } });
    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }
    if (item.owner_id !== req.user!.id) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    // A simplified update parsing
    const updated = await prisma.item.update({
      where: { id: String(req.params.id) },
      data: req.body
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const item = await prisma.item.findUnique({ where: { id: String(req.params.id) }, include: { bookings: true } });
    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }
    if (item.owner_id !== req.user!.id) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }
    
    // Check bookings integrity (can't delete if there are active bookings, etc)
    const activeBookings = item.bookings.filter(b => b.status === 'pending' || b.status === 'accepted' || b.status === 'active');
    if (activeBookings.length > 0) {
      res.status(409).json({ error: 'Cannot delete item with active or pending bookings' });
      return;
    }

    await prisma.item.delete({ where: { id: String(req.params.id) } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
