import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { generatePassportHash } from '../utils/hash';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const prisma = new PrismaClient();

const conditionSchema = z.object({
  overall: z.string(),
  exterior: z.string(),
  functional: z.string(),
  accessories: z.string(),
  notes: z.string()
});

const itemSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  tags: z.array(z.string()).optional(),
  photo_urls: z.array(z.string()).optional(),
  serial_number: z.string().optional(),
  price_per_day: z.number().min(0),
  deposit_amount: z.number().min(0),
  condition_checklist: conditionSchema.optional(),
  city: z.string().min(1),
  area: z.string().min(1),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = itemSchema.parse(req.body);
    const item_id = uuidv4();
    const created_at = new Date();
    
    // Sensible default condition if not provided
    const initialCondition = data.condition_checklist || {
      overall: "New/Excellent",
      exterior: "No visible wear",
      functional: "Fully working",
      accessories: "All included",
      notes: "Initial listing"
    };

    const passport_hash = generatePassportHash({
      id: item_id,
      owner_id: req.user!.id,
      created_at,
      serial_number: data.serial_number || null
    });

    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.item.create({
        data: {
          ...data,
          id: item_id,
          owner_id: req.user!.id,
          condition_checklist: initialCondition,
          passport_hash,
          created_at,
        }
      });

      await tx.itemHistoryEvent.create({
        data: {
          item_id: item.id,
          actor_id: req.user!.id,
          event_type: 'ITEM_LISTED',
          condition_snapshot: initialCondition,
          created_at
        }
      });

      return item;
    });

    res.json(result);
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
    if (category) where.category = String(category);
    if (area) where.area = { contains: String(area), mode: 'insensitive' };
    if (search) {
      where.OR = [
        { title: { contains: String(search), mode: 'insensitive' } },
        { description: { contains: String(search), mode: 'insensitive' } }
      ];
    }
    const items = await prisma.item.findMany({
      where,
      include: { owner: { select: { id: true, name: true } } },
      orderBy: { created_at: 'desc' }
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/mine', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const items = await prisma.item.findMany({
      where: { owner_id: req.user!.id },
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
      include: { owner: { select: { id: true, name: true } } }
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

// GET /api/items/:id/passport
router.get('/:id/passport', async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    let currentUserId: string | null = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string };
        currentUserId = decoded.userId;
      } catch (e) {}
    }

    const item = await prisma.item.findUnique({
      where: { id: String(req.params.id) },
      include: { owner: { select: { id: true, name: true } } }
    });

    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    const history = await prisma.itemHistoryEvent.findMany({
      where: { item_id: item.id },
      orderBy: { created_at: 'desc' },
      include: { actor: { select: { id: true, name: true } } }
    });

    // PII Redaction
    const isOwner = currentUserId === item.owner_id;

    const redactedHistory = history.map(event => {
      let actorName = 'Verified User';
      if (event.actor_id === item.owner_id) {
        actorName = 'Owner';
      } else if (isOwner || event.actor_id === currentUserId) {
        actorName = event.actor?.name || 'Verified Renter';
      } else if (event.actor_id) {
        actorName = 'Verified Renter';
      }

      return {
        id: event.id,
        event_type: event.event_type,
        actor_name: actorName,
        condition_snapshot: event.condition_snapshot,
        metadata: event.metadata,
        created_at: event.created_at
      };
    });

    res.json({
      id: item.id,
      title: item.title,
      passport_hash: item.passport_hash,
      serial_number: item.serial_number,
      current_condition: item.condition_checklist,
      owner: item.owner.name,
      created_at: item.created_at,
      history: redactedHistory
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id/condition', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const condition = conditionSchema.parse(req.body);
    
    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.item.findUnique({ where: { id: String(req.params.id) } });
      if (!item) throw new Error('Item not found');
      if (item.owner_id !== req.user!.id) throw new Error('Unauthorized');

      const updated = await tx.item.update({
        where: { id: item.id },
        data: { condition_checklist: condition }
      });

      await tx.itemHistoryEvent.create({
        data: {
          item_id: item.id,
          actor_id: req.user!.id,
          event_type: 'CONDITION_UPDATED',
          condition_snapshot: condition
        }
      });

      return updated;
    });

    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input' });
      return;
    }
    if (error instanceof Error && (error.message === 'Item not found' || error.message === 'Unauthorized')) {
      res.status(error.message === 'Item not found' ? 404 : 403).json({ error: error.message });
      return;
    }
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

    const { serial_number, condition_checklist, passport_hash, ...safeData } = req.body || {};

    const updated = await prisma.item.update({
      where: { id: String(req.params.id) },
      data: safeData
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
    
    const activeBookings = item.bookings.filter(b => ['pending', 'accepted', 'active'].includes(b.status));
    if (activeBookings.length > 0) {
      res.status(409).json({ error: 'Cannot delete item with active or pending bookings' });
      return;
    }

    await prisma.$transaction(async (tx) => {
       await tx.itemHistoryEvent.deleteMany({ where: { item_id: item.id } });
       await tx.item.delete({ where: { id: String(req.params.id) } });
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
