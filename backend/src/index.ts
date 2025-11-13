import express, { Express, Request, Response } from "express";
import path from "path";
import fs from "fs";
import { createServer } from "http";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import dotenv from "dotenv";
import { initializeSocket, cleanupSocket } from "./lib/socket";
import paystackWebhookRoutes from "./routes/paystack";
import prisma from "./lib/db";

// Load environment variables (.env.local overrides .env)
try {
  const envLocalPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath });
  } else {
    dotenv.config(); // fallback to .env
  }
} catch {
  dotenv.config();
}

// Import routes
import authRoutes from "./routes/auth";
import customerRoutes from "./routes/customers";
import userRoutes from "./routes/users";
import roleRoutes from "./routes/roles";
import planRoutes from "./routes/plans";
import invoiceRoutes from "./routes/invoices";
import supportTicketRoutes from "./routes/support-tickets";
import analyticsRoutes from "./routes/analytics";
import systemRoutes from "./routes/system";
// Property Owner routes
import propertyRoutes from "./routes/properties";
import unitRoutes from "./routes/units";
import leaseRoutes from "./routes/leases";
import propertyManagerRoutes from "./routes/property-managers";
// Property Manager routes
import maintenanceRoutes from "./routes/maintenance";
import paymentRoutes from "./routes/payments";
import accessControlRoutes from "./routes/access-control";
import notificationRoutes from "./routes/notifications";
import dashboardRoutes from "./routes/dashboard";
// Cache management routes
import cacheRoutes from "./routes/cache";
// Tenant routes
import tenantRoutes from "./routes/tenant";
// Financial routes
import financialRoutes from "./routes/financial";
// Expense routes
import expenseRoutes from "./routes/expenses";
// Document routes
import documentRoutes from "./routes/documents";
// Settings routes
import settingsRoutes from "./routes/settings";
// Payment Methods routes
import paymentMethodRoutes from "./routes/payment-methods";
// Subscription routes
import subscriptionRoutes from "./routes/subscriptions";
// Billing Analytics routes
import billingAnalyticsRoutes from "./routes/billing-analytics";
// Billing Transactions routes
import billingTransactionsRoutes from "./routes/billing-transactions";
// Upload routes
import uploadRoutes from "./routes/uploads";
// Onboarding routes
import onboardingRoutes from "./routes/onboarding";
import adminOnboardingRoutes from "./routes/admin-onboarding";
// Subscription management routes
import subscriptionManagementRoutes from "./routes/subscription";
// Developer Dashboard routes
import developerDashboardRoutes from "./routes/developer-dashboard";
// Cron jobs
import { initializeCronJobs } from "./lib/cron-jobs";

// Create Express app
const app: Express = express();
const PORT = process.env.PORT || 5000;

// Middleware
// Security headers (allow cross-origin resource policy for images like logo)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(compression()); // Compress responses

// Mount webhook route BEFORE JSON parser to access raw body for signature verification
app.use("/api/paystack", paystackWebhookRoutes);

// CORS configuration - Allow multiple origins
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "https://contrezz.com",
  "https://www.contrezz.com",
  "https://api.contrezz.com",
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGIN,
].filter(Boolean); // Remove undefined values

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Postman, curl, etc.)
      if (!origin) return callback(null, true);

      // Allow any Vercel deployment (production and preview URLs)
      if (origin.includes("vercel.app")) {
        return callback(null, true);
      }

      // Allow any DigitalOcean App Platform deployment
      if (origin.includes("ondigitalocean.app")) {
        return callback(null, true);
      }

      // Check against allowed origins list
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.warn(`⚠️  CORS blocked request from origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Cache-Control",
      "Pragma",
      "Expires",
      "X-Requested-With",
    ],
  })
);

app.use(morgan("dev")); // Logging
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Static uploads directory (ensure exists)
const uploadsDir = path.resolve(__dirname, "../uploads");
const logosDir = path.resolve(uploadsDir, "logos");
try {
  fs.mkdirSync(logosDir, { recursive: true });
} catch {}
// Set permissive headers for static assets to load across origins
app.use(
  "/uploads",
  (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    if (process.env.FRONTEND_URL) {
      res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_URL);
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    // Prevent aggressive browser caching for brand assets (logos/favicons)
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    next();
  },
  express.static(uploadsDir, {
    etag: false,
    lastModified: true,
    cacheControl: true,
    maxAge: 0,
    setHeaders: (res) => {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    },
  })
);

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Health check alias under /api for environments that preserve the '/api' prefix at the ingress layer
app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Public branding endpoint (no auth) - used by login pages and non-admin dashboards to fetch logo/favicon
app.get("/api/public/branding", async (req: Request, res: Response) => {
  try {
    const [logo, favicon] = await Promise.all([
      prisma.system_settings.findUnique({ where: { key: "platform_logo_url" } }),
      prisma.system_settings.findUnique({ where: { key: "platform_favicon_url" } }),
    ]);

    res.json({
      logoUrl: logo && typeof logo.value === "string" ? logo.value : null,
      faviconUrl: favicon && typeof favicon.value === "string" ? favicon.value : null,
    });
  } catch (e: any) {
    res.status(500).json({
      error: "Failed to load branding",
      message: e?.message,
    });
  }
});

// Deep health check that validates database connectivity and key tables
app.get("/api/_diag/db", async (req: Request, res: Response) => {
  try {
    // Basic connectivity
    await prisma.$queryRaw`SELECT 1`;
    // Try to introspect a few critical tables, but ignore if not present
    let adminsCount: number | null = null;
    try {
      adminsCount = await prisma.admins.count();
    } catch (e) {
      adminsCount = null;
    }
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        connected: true,
        adminsCount,
      },
    });
  } catch (e: any) {
    res.status(500).json({
      status: "error",
      message: "Database check failed",
      errorCode: e?.code,
      error: e?.message || String(e),
    });
  }
});

// API Routes
app.use("/api/auth", authRoutes);
// Onboarding routes (public)
app.use("/api/onboarding", onboardingRoutes);
// Admin routes
app.use("/api/admin/onboarding", adminOnboardingRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/users", userRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/support-tickets", supportTicketRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/system", systemRoutes);
// Property Owner/Manager routes
app.use("/api/properties", propertyRoutes);
app.use("/api/units", unitRoutes);
app.use("/api/leases", leaseRoutes);
app.use("/api/property-managers", propertyManagerRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/access-control", accessControlRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/dashboard", dashboardRoutes);
// Cache management
app.use("/api/cache", cacheRoutes);
// Tenant routes
app.use("/api/tenant", tenantRoutes);
// Financial routes
app.use("/api/financial", financialRoutes);
// Expense routes
app.use("/api/expenses", expenseRoutes);
// Document routes
app.use("/api/documents", documentRoutes);
// Settings routes
app.use("/api/settings", settingsRoutes);
// Payment Methods routes
app.use("/api/payment-methods", paymentMethodRoutes);
// Subscription routes
app.use("/api/subscriptions", subscriptionRoutes);
// Subscription management routes (trial, upgrade, reactivate)
app.use("/api/subscription", subscriptionManagementRoutes);
// Billing Analytics routes
app.use("/api/billing-analytics", billingAnalyticsRoutes);
// Billing Transactions routes
app.use("/api/billing-transactions", billingTransactionsRoutes);
// Upload routes
app.use("/api/uploads", uploadRoutes);
// Developer Dashboard routes
app.use("/api/developer-dashboard", developerDashboardRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.io
initializeSocket(httpServer).catch((error) => {
  console.error("❌ Failed to initialize Socket.io:", error);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully...");
  await cleanupSocket();
  httpServer.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully...");
  await cleanupSocket();
  httpServer.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `🌐 CORS enabled for: ${
      process.env.FRONTEND_URL || "http://localhost:5173"
    }`
  );
  console.log(`🔌 Socket.io real-time updates enabled`);

  // Initialize cron jobs for scheduled tasks
  initializeCronJobs();
});

export default app;
