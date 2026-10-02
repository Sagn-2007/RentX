import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/:id/reputation', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = String(req.params.id);
    
    // Validate user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Calculate Renter Reputation
    const renterReviews = await prisma.review.aggregate({
      where: { target_id: userId, target_role: 'RENTER' },
      _avg: { rating: true },
      _count: { rating: true }
    });

    const completedAsRenter = await prisma.booking.count({
      where: { renter_id: userId, status: 'returned' }
    });

    const cancelledAsRenter = await prisma.booking.count({
      where: { renter_id: userId, status: 'cancelled' }
    });

    // Calculate Owner Reputation
    const ownerReviews = await prisma.review.aggregate({
      where: { target_id: userId, target_role: 'OWNER' },
      _avg: { rating: true },
      _count: { rating: true }
    });

    const completedAsOwner = await prisma.booking.count({
      where: { item: { owner_id: userId }, status: 'returned' }
    });

    const cancelledAsOwner = await prisma.booking.count({
      where: { item: { owner_id: userId }, status: 'cancelled' }
    });

    res.json({
      renter: {
        average_rating: renterReviews._avg.rating || 0,
        total_ratings: renterReviews._count.rating || 0,
        completed_rentals: completedAsRenter,
        cancelled_rentals: cancelledAsRenter
      },
      owner: {
        average_rating: ownerReviews._avg.rating || 0,
        total_ratings: ownerReviews._count.rating || 0,
        completed_rentals: completedAsOwner,
        cancelled_rentals: cancelledAsOwner
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id/reviews', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = String(req.params.id);
    const role = req.query.role as string; // optionally filter by OWNER or RENTER

    const where: any = { target_id: userId };
    if (role === 'OWNER' || role === 'RENTER') {
      where.target_role = role;
    }

    const reviews = await prisma.review.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        reviewer: { select: { name: true } },
        booking: {
          include: { item: { select: { title: true } } }
        }
      }
    });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
