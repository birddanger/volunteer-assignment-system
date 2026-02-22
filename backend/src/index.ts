import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import 'express-async-errors';
import dotenv from 'dotenv';
import { setupDatabase } from './db/setup.js';
import { seedDatabase } from './db/seed.js';
import { errorHandler, authMiddleware } from './middleware/auth.js';
import authRoutes from './routes/authRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import templateRoutes from './routes/templateRoutes.js';
import competitionRoutes from './routes/competitionRoutes.js';

const app = express();

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // limit login/register attempts
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again later' },
});

// Middleware
app.use(generalLimiter);
app.use(cookieParser());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));

// Initialize database on startup
async function initializeDatabase() {
  try {
    console.log('Initializing database...');
    await setupDatabase();
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Seeding database with sample data...');
      await seedDatabase();
    }
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
}

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/events/:eventId/sessions', sessionRoutes);
app.use('/api/events/:eventId/tasks', taskRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/events/:eventId/competition', competitionRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Error handling
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

async function start() {
  await initializeDatabase();
  
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Database: ${process.env.DB_NAME}`);
    console.log(`🌐 Frontend: ${process.env.FRONTEND_URL}`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
