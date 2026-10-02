import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const bookingSchema = z.object({
  item_id: z.string(),
  start_date: z.string().transform((str) => new Date(str)),
  end_date: z.string().transform((str) => new Date(str)),
});

const conditionSchema = z.object({
  overall: z.string(),
  exterior: z.string(),
  functional: z.string(),
  accessories: z.string(),
  notes: z.string()
});

router.get('/my', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const [asRenter, asOwner] = await Promise.all([
      prisma.booking.findMany({
        where: { renter_id: userId },
        include: { item: true },
        orderBy: { created_at: 'desc' }
      }),
      prisma.booking.findMany({
        where: { item: { owner_id: userId } },
        include: { item: true, renter: { select: { id: true, name: true, email: true } } },
        orderBy: { created_at: 'desc' }
      })
    ]);
    res.json({ asRenter, asOwner });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { item_id, start_date, end_date } = bookingSchema.parse(req.body);
    
    if (start_date >= end_date) {
      res.status(400).json({ error: 'start_date must be before end_date' });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.item.findUnique({ where: { id: item_id } });
      if (!item) throw new Error('Item not found');
      if (!item.is_available) throw new Error('Item is not available');
      if (item.owner_id === req.user!.id) throw new Error('Cannot rent your own item');

      const overlapping = await tx.booking.findFirst({
        where: {
          item_id,
          status: { in: ['pending', 'accepted', 'active'] },
          AND: [ { start_date: { lt: end_date } }, { end_date: { gt: start_date } } ]
        }
      });

      if (overlapping) throw new Error('Item is already booked for these dates');

      const booking = await tx.booking.create({
        data: {
          item_id,
          renter_id: req.user!.id,
          start_date,
          end_date,
          status: 'pending'
        }
      });

      await tx.itemHistoryEvent.create({
        data: {
          item_id: item.id,
          booking_id: booking.id,
          actor_id: req.user!.id,
          event_type: 'RENTAL_REQUESTED',
          condition_snapshot: item.condition_checklist || undefined
        }
      });

      return booking;
    });

    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input' });
      return;
    }
    if (error instanceof Error) {
      const msg = error.message;
      if (msg === 'Item not found') { res.status(404).json({ error: msg }); return; }
      if (msg === 'Item is already booked for these dates') { res.status(409).json({ error: msg }); return; }
      res.status(400).json({ error: msg });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id/accept', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({ where: { id: String(req.params.id) }, include: { item: true } });
      if (!booking) throw new Error('Booking not found');
      if (booking.item.owner_id !== req.user!.id) throw new Error('Unauthorized');
      if (booking.status !== 'pending') throw new Error('Can only accept pending bookings');

      const overlapping = await tx.booking.findFirst({
        where: {
          id: { not: booking.id },
          item_id: booking.item_id,
          status: { in: ['accepted', 'active'] },
          AND: [ { start_date: { lt: booking.end_date } }, { end_date: { gt: booking.start_date } } ]
        }
      });

      if (overlapping) throw new Error('Item is already booked for these dates');

      const updated = await tx.booking.update({
        where: { id: booking.id },
        data: { status: 'accepted' }
      });

      await tx.itemHistoryEvent.create({
        data: {
          item_id: booking.item_id,
          booking_id: booking.id,
          actor_id: req.user!.id,
          event_type: 'RENTAL_ACCEPTED',
          condition_snapshot: booking.item.condition_checklist || undefined
        }
      });

      return updated;
    });

    res.json(result);
  } catch (error) {
    if (error instanceof Error) {
      const msg = error.message;
      if (msg === 'Booking not found') { res.status(404).json({ error: msg }); return; }
      if (msg === 'Unauthorized') { res.status(403).json({ error: msg }); return; }
      if (msg === 'Item is already booked for these dates') { res.status(409).json({ error: msg }); return; }
      res.status(400).json({ error: msg });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id/reject', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const booking = await prisma.booking.findUnique({ where: { id: String(req.params.id) }, include: { item: true } });
    if (!booking) { res.status(404).json({ error: 'Booking not found' }); return; }
    if (booking.item.owner_id !== req.user!.id) { res.status(403).json({ error: 'Unauthorized' }); return; }
    if (booking.status !== 'pending') { res.status(400).json({ error: 'Can only reject pending bookings' }); return; }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: 'rejected' }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id/cancel', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const booking = await prisma.booking.findUnique({ where: { id: String(req.params.id) }, include: { item: true } });
    if (!booking) { res.status(404).json({ error: 'Booking not found' }); return; }
    if (booking.renter_id !== req.user!.id && booking.item.owner_id !== req.user!.id) { res.status(403).json({ error: 'Unauthorized' }); return; }
    if (booking.status !== 'pending' && booking.status !== 'accepted') { res.status(400).json({ error: `Cannot cancel a ${booking.status} booking` }); return; }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: 'cancelled' }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id/return', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let payloadCondition: any = undefined;
    if (req.body.condition) {
      payloadCondition = conditionSchema.parse(req.body.condition);
    }

    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({ where: { id: String(req.params.id) }, include: { item: true } });
      if (!booking) throw new Error('Booking not found');
      if (booking.renter_id !== req.user!.id && booking.item.owner_id !== req.user!.id) throw new Error('Unauthorized');
      if (booking.status !== 'active' && booking.status !== 'accepted') throw new Error('Booking must be active or accepted to return');

      const finalCondition = payloadCondition || booking.item.condition_checklist;

      if (payloadCondition) {
        await tx.item.update({
          where: { id: booking.item_id },
          data: { condition_checklist: payloadCondition }
        });
      }

      const updated = await tx.booking.update({
        where: { id: booking.id },
        data: { status: 'returned' }
      });

      await tx.itemHistoryEvent.create({
        data: {
          item_id: booking.item_id,
          booking_id: booking.id,
          actor_id: req.user!.id,
          event_type: 'RENTAL_RETURNED',
          condition_snapshot: finalCondition || undefined
        }
      });

      return updated;
    });

    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid condition format' });
      return;
    }
    if (error instanceof Error) {
      const msg = error.message;
      if (msg === 'Booking not found') { res.status(404).json({ error: msg }); return; }
      if (msg === 'Unauthorized') { res.status(403).json({ error: msg }); return; }
      res.status(400).json({ error: msg });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
