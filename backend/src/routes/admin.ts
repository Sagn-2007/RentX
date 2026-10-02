import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Ensure all routes require authentication and admin role
router.use(authenticate, requireAdmin);

router.get('/stats', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [
      totalUsers,
      totalItems,
      totalBookings,
      pendingRequests,
      acceptedBookings,
      activeRentals,
      returnedBookings,
      rejectedRequests,
      cancelledBookings
    ] = await Promise.all([
      prisma.user.count(),
      prisma.item.count(),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: 'pending' } }),
      prisma.booking.count({ where: { status: 'accepted' } }),
      prisma.booking.count({ where: { status: 'active' } }),
      prisma.booking.count({ where: { status: 'returned' } }),
      prisma.booking.count({ where: { status: 'rejected' } }),
      prisma.booking.count({ where: { status: 'cancelled' } })
    ]);

    res.json({
      totalUsers,
      totalItems,
      totalBookings,
      pendingRequests,
      acceptedBookings,
      activeRentals,
      returnedBookings,
      rejectedRequests,
      cancelledBookings
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/users', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
        _count: {
          select: {
            items: true,
            bookings: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/items', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const items = await prisma.item.findMany({
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: { bookings: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/bookings', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        item: { select: { id: true, title: true, owner: { select: { id: true, name: true, email: true } } } },
        renter: { select: { id: true, name: true, email: true } }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
