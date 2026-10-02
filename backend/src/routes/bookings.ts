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

// GET user's bookings (as renter or owner)
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

    const item = await prisma.item.findUnique({ where: { id: item_id } });
    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    if (!item.is_available) {
      res.status(400).json({ error: 'Item is not available' });
      return;
    }

    if (item.owner_id === req.user!.id) {
      res.status(403).json({ error: 'Cannot rent your own item' });
      return;
    }

    // Prevent overlapping bookings
    const overlapping = await prisma.booking.findFirst({
      where: {
        item_id,
        status: { in: ['pending', 'accepted', 'active'] },
        AND: [
          { start_date: { lt: end_date } },
          { end_date: { gt: start_date } }
        ]
      }
    });

    if (overlapping) {
      res.status(409).json({ error: 'Item is already booked for these dates' });
      return;
    }

    const booking = await prisma.booking.create({
      data: {
        item_id,
        renter_id: req.user!.id,
        start_date,
        end_date,
        status: 'pending'
      }
    });

    res.json(booking);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input' });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id/accept', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const booking = await prisma.booking.findUnique({ where: { id: String(req.params.id) }, include: { item: true } });
    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    if (booking.item.owner_id !== req.user!.id) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    if (booking.status !== 'pending') {
      res.status(400).json({ error: 'Can only accept pending bookings' });
      return;
    }

    // Recheck overlap
    const overlapping = await prisma.booking.findFirst({
      where: {
        id: { not: booking.id },
        item_id: booking.item_id,
        status: { in: ['accepted', 'active'] },
        AND: [
          { start_date: { lt: booking.end_date } },
          { end_date: { gt: booking.start_date } }
        ]
      }
    });

    if (overlapping) {
      res.status(409).json({ error: 'Item is already booked for these dates' });
      return;
    }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: 'accepted' }
    });

    // We can auto reject other pending overlapping bookings here if we wanted, but MVP keeps it simple.

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id/reject', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const booking = await prisma.booking.findUnique({ where: { id: String(req.params.id) }, include: { item: true } });
    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    if (booking.item.owner_id !== req.user!.id) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    if (booking.status !== 'pending') {
      res.status(400).json({ error: 'Can only reject pending bookings' });
      return;
    }

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
    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    if (booking.renter_id !== req.user!.id && booking.item.owner_id !== req.user!.id) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    if (booking.status !== 'pending' && booking.status !== 'accepted') {
      res.status(400).json({ error: `Cannot cancel a ${booking.status} booking` });
      return;
    }

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
    const booking = await prisma.booking.findUnique({ where: { id: String(req.params.id) }, include: { item: true } });
    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    // For MVP, renter or owner can mark as returned.
    if (booking.renter_id !== req.user!.id && booking.item.owner_id !== req.user!.id) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    if (booking.status !== 'active' && booking.status !== 'accepted') {
      res.status(400).json({ error: 'Booking must be active or accepted to return' });
      return;
    }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: 'returned' }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
