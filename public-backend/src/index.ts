import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { rateLimiter } from "./middleware/rateLimiter";
import careerRoutes from "./routes/careers";
import adminAuthRoutes from "./routes/admin/auth";
import adminLandingPagesRoutes from "./routes/admin/landing-pages";
import adminCareersRoutes from "./routes/admin/careers";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// CORS must be before helmet to avoid conflicts
// CORS configuration
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .filter(Boolean);
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      // In development, allow localhost with any port
      if (
        process.env.NODE_ENV === "development" &&
        origin.startsWith("http://localhost:")
      ) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: false, // No auth cookies needed for public API
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Cache-Control",
      "Pragma",
      "Accept",
      "Origin",
      "X-Requested-With",
    ],
    exposedHeaders: ["Content-Length", "Content-Type"],
    maxAge: 86400, // 24 hours - cache preflight requests
  })
);

// Security middleware (after CORS)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "unsafe-none" },
  })
);

// Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Rate limiting
const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000");
const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100");
app.use(rateLimiter(windowMs, maxRequests));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "contrezz-public-api",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Public API Routes
app.use("/api/careers", careerRoutes);

// Admin API Routes (require authentication)
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin/landing-pages", adminLandingPagesRoutes);
app.use("/api/admin/careers", adminCareersRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    name: "Contrezz Public API",
    version: "1.0.0",
    endpoints: {
      careers: "/api/careers",
      health: "/health",
      admin: {
        auth: "/api/admin/auth",
        landingPages: "/api/admin/landing-pages",
        careers: "/api/admin/careers",
      },
    },
    documentation: "https://docs.contrezz.com/api",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
    path: req.path,
  });
});

// Error handler
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("❌ Server error:", err);

    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
);

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   Contrezz Public API Server          ║
╠════════════════════════════════════════╣
║   Environment: ${
    process.env.NODE_ENV?.padEnd(24) || "development".padEnd(24)
  }║
║   Port: ${String(PORT).padEnd(31)}║
║   CORS: ${allowedOrigins.length} origin(s)${" ".repeat(18)}║
╚════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully...");
  process.exit(0);
});

export default app;
