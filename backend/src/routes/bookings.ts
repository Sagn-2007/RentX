
import rateLimit from 'express-rate-limit';
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
  termsAccepted: z.boolean().optional(),
  termsVersion: z.string().optional()
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
    const [asRenter, asOwner, myReviews] = await Promise.all([
      prisma.booking.findMany({
        where: { renter_id: userId },
        include: { item: true },
        orderBy: { created_at: 'desc' }
      }),
      prisma.booking.findMany({
        where: { item: { owner_id: userId } },
        include: { item: true, renter: { select: { id: true, name: true, email: true } } },
        orderBy: { created_at: 'desc' }
      }),
      // Which bookings has this user already reviewed?
      prisma.review.findMany({
        where: { reviewer_id: userId },
        select: { booking_id: true }
      })
    ]);

    const reviewedBookingIds = new Set(myReviews.map(r => r.booking_id));

    const annotate = (b: any) => ({ ...b, my_review_submitted: reviewedBookingIds.has(b.id) });
    res.json({ asRenter: asRenter.map(annotate), asOwner: asOwner.map(annotate) });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { item_id, start_date, end_date, termsAccepted, termsVersion } = bookingSchema.parse(req.body);

    if (!termsAccepted) {
      res.status(400).json({ error: 'Rental agreement must be accepted before requesting this item.' });
      return;
    }
    if (termsVersion !== 'v1') {
      res.status(400).json({ error: 'Invalid or outdated rental agreement version.' });
      return;
    }
    
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
          status: { in: ['accepted', 'active'] },
          AND: [ { start_date: { lt: end_date } }, { end_date: { gt: start_date } } ]
        }
      });

      if (overlapping) throw new Error('Item is already booked for these dates');

      // DUPLICATE REQUEST RULE:
      // Prevent the SAME renter from having multiple active requests for the SAME item.
      // Must be scoped to renter_id + item_id.
      const existingRenterRequest = await tx.booking.findFirst({
        where: {
          renter_id: req.user!.id,
          item_id,
          status: { in: ['pending', 'accepted', 'active'] }
        }
      });

      if (existingRenterRequest) {
        throw new Error('You already have an active rental request for this item.');
      }

      const booking = await tx.booking.create({
        data: {
          item_id,
          renter_id: req.user!.id,
          start_date,
          end_date,
          status: 'pending',
          terms_accepted_at: new Date(),
          terms_version: termsVersion
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
    if (req.body && req.body.condition) {
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


router.post('/:id/reviews', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { rating, comment } = req.body;
    
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: String(req.params.id) },
        include: { item: true }
      });

      if (!booking) throw new Error('Booking not found');
      if (booking.status !== 'returned') throw new Error('Can only review completed (returned) rentals');

      const isRenter = booking.renter_id === req.user!.id;
      const isOwner = booking.item.owner_id === req.user!.id;

      if (!isRenter && !isOwner) {
        throw new Error('Unauthorized');
      }

      // If reviewer is Renter, target is Owner. If reviewer is Owner, target is Renter.
      const targetId = isRenter ? booking.item.owner_id : booking.renter_id;
      const targetRole = isRenter ? 'OWNER' : 'RENTER';

      // Check if already reviewed
      const existingReview = await tx.review.findUnique({
        where: {
          booking_id_reviewer_id: {
            booking_id: booking.id,
            reviewer_id: req.user!.id
          }
        }
      });

      if (existingReview) {
        throw new Error('You have already reviewed this rental');
      }

      const review = await tx.review.create({
        data: {
          booking_id: booking.id,
          reviewer_id: req.user!.id,
          target_id: targetId,
          target_role: targetRole,
          rating,
          comment: comment ? String(comment).substring(0, 500) : null
        }
      });

      return review;
    });

    res.json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Booking not found') { res.status(404).json({ error: error.message }); return; }
      if (error.message === 'Unauthorized') { res.status(403).json({ error: error.message }); return; }
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});


const messageRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: (req: any) => {
    return `${req.user?.id}:${req.params.id}`;
  },
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many messages sent. Please try again later.' });
  }
});

router.get('/:id/messages', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bookingId = String(req.params.id);
    const userId = req.user!.id;
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 50, 1), 100);
    const before = req.query.before as string | undefined;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { item: true }
    });

    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    if (userId !== booking.renter_id && userId !== booking.item.owner_id) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const whereClause: any = { booking_id: bookingId };
    
    if (before) {
      const beforeMessage = await prisma.message.findUnique({ where: { id: before } });
      if (beforeMessage) {
         whereClause.OR = [
           { created_at: { lt: beforeMessage.created_at } },
           { created_at: beforeMessage.created_at, id: { lt: beforeMessage.id } }
         ];
      }
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      take: limit,
      orderBy: [
        { created_at: 'desc' },
        { id: 'desc' }
      ],
      include: { sender: { select: { name: true } } }
    });

    messages.reverse();
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/messages', authenticate, messageRateLimiter, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bookingId = String(req.params.id);
    const userId = req.user!.id;
    let { body } = req.body;

    if (typeof body !== 'string') {
      res.status(400).json({ error: 'Message body must be a string' });
      return;
    }

    body = body.trim();
    if (!body || body.length === 0) {
      res.status(400).json({ error: 'Message cannot be empty' });
      return;
    }

    if (body.length > 1000) {
      res.status(400).json({ error: 'Message too long (max 1000 characters)' });
      return;
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { item: true }
    });

    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    if (userId !== booking.renter_id && userId !== booking.item.owner_id) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    if (['returned', 'cancelled', 'rejected'].includes(booking.status)) {
      res.status(400).json({ error: 'Chat is closed for this booking' });
      return;
    }
    
    if (!['pending', 'accepted', 'active'].includes(booking.status)) {
      res.status(400).json({ error: 'Chat is not available for this booking status' });
      return;
    }

    const savedMessage = await prisma.message.create({
      data: {
        booking_id: bookingId,
        sender_id: userId,
        body: body,
      },
      include: { sender: { select: { name: true } } }
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`booking:${bookingId}`).emit('new_message', savedMessage);
    }

    res.json(savedMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});
export default router;
