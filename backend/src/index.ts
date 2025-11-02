import express, { Express, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import { initializeSocket, cleanupSocket } from './lib/socket';
import paystackWebhookRoutes from './routes/paystack';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth';
import customerRoutes from './routes/customers';
import userRoutes from './routes/users';
import roleRoutes from './routes/roles';
import planRoutes from './routes/plans';
import invoiceRoutes from './routes/invoices';
import supportTicketRoutes from './routes/support-tickets';
import analyticsRoutes from './routes/analytics';
import systemRoutes from './routes/system';
// Property Owner routes
import propertyRoutes from './routes/properties';
import unitRoutes from './routes/units';
import leaseRoutes from './routes/leases';
import propertyManagerRoutes from './routes/property-managers';
// Property Manager routes
import maintenanceRoutes from './routes/maintenance';
import paymentRoutes from './routes/payments';
import accessControlRoutes from './routes/access-control';
import notificationRoutes from './routes/notifications';
import dashboardRoutes from './routes/dashboard';
// Cache management routes
import cacheRoutes from './routes/cache';
// Tenant routes
import tenantRoutes from './routes/tenant';
// Financial routes
import financialRoutes from './routes/financial';
// Expense routes
import expenseRoutes from './routes/expenses';
// Document routes
import documentRoutes from './routes/documents';
// Settings routes
import settingsRoutes from './routes/settings';
// Payment Methods routes
import paymentMethodRoutes from './routes/payment-methods';
// Upload routes
import uploadRoutes from './routes/uploads';

// Create Express app
const app: Express = express();
const PORT = process.env.PORT || 5000;

// Middleware
// Security headers (allow cross-origin resource policy for images like logo)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(compression()); // Compress responses

// Mount webhook route BEFORE JSON parser to access raw body for signature verification
app.use('/api/paystack', paystackWebhookRoutes);

// CORS configuration - Allow multiple origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean); // Remove undefined values

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, curl, etc.)
    if (!origin) return callback(null, true);

    // Allow any Vercel deployment (production and preview URLs)
    if (origin.includes('vercel.app')) {
      return callback(null, true);
    }

    // Check against allowed origins list
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`⚠️  CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Cache-Control',
    'Pragma',
    'Expires',
    'X-Requested-With'
  ]
}));

app.use(morgan('dev')); // Logging
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static uploads directory (ensure exists)
const uploadsDir = path.resolve(__dirname, '../uploads');
const logosDir = path.resolve(uploadsDir, 'logos');
try {
  fs.mkdirSync(logosDir, { recursive: true });
} catch {}
// Set permissive headers for static assets to load across origins
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  if (process.env.FRONTEND_URL) {
    res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  next();
}, express.static(uploadsDir));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
// Admin routes
app.use('/api/customers', customerRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/support-tickets', supportTicketRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/system', systemRoutes);
// Property Owner/Manager routes
app.use('/api/properties', propertyRoutes);
app.use('/api/units', unitRoutes);
app.use('/api/leases', leaseRoutes);
app.use('/api/property-managers', propertyManagerRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/access-control', accessControlRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
// Cache management
app.use('/api/cache', cacheRoutes);
// Tenant routes
app.use('/api/tenant', tenantRoutes);
// Financial routes
app.use('/api/financial', financialRoutes);
// Expense routes
app.use('/api/expenses', expenseRoutes);
// Document routes
app.use('/api/documents', documentRoutes);
// Settings routes
app.use('/api/settings', settingsRoutes);
// Payment Methods routes
app.use('/api/payment-methods', paymentMethodRoutes);
// Upload routes
app.use('/api/uploads', uploadRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.io
initializeSocket(httpServer).catch(error => {
  console.error('❌ Failed to initialize Socket.io:', error);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await cleanupSocket();
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await cleanupSocket();
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`🔌 Socket.io real-time updates enabled`);
});

export default app;

