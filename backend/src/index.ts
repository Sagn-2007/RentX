import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import itemsRoutes from './routes/items';
import bookingsRoutes from './routes/bookings';
import adminRoutes from './routes/admin';
import usersRoutes from './routes/users';

dotenv.config();

const app = express();
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

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
