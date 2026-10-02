import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

import authRoutes from './routes/auth';
import itemsRoutes from './routes/items';
import bookingsRoutes from './routes/bookings';
import adminRoutes from './routes/admin';
import usersRoutes from './routes/users';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const prisma = new PrismaClient();

// Socket.io Authentication Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error: Token missing'));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as { id: string, role: string };
    (socket as any).user_id = decoded.id;
    next();
  } catch (err) {
    return next(new Error('Authentication error: Invalid token'));
  }
});

io.on('connection', (socket) => {
  const userId = (socket as any).user_id;

  socket.on('join_room', async ({ booking_id }) => {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: booking_id },
        include: { item: true }
      });

      if (!booking) {
        socket.emit('room_error', 'Booking not found');
        return;
      }

      if (userId !== booking.renter_id && userId !== booking.item.owner_id) {
        socket.emit('room_error', 'Unauthorized');
        return;
      }

      socket.join(`booking:${booking_id}`);
    } catch (e) {
      socket.emit('room_error', 'Server error');
    }
  });
});

app.set('io', io); // Attach to app

const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', usersRoutes);

app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'RentX Backend is running.',
  });
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
