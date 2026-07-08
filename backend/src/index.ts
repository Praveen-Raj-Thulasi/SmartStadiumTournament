import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { connectDB } from './db';

// Import Routes
import authRoutes from './routes/authRoutes';
import matchRoutes from './routes/matchRoutes';
import incidentRoutes from './routes/incidentRoutes';
import staffRoutes from './routes/staffRoutes';
import metricRoutes from './routes/metricRoutes';

// Import Middleware
import { errorHandler } from './middleware/error';
import { sanitizeNoSql, sanitizeXSS } from './middleware/sanitize';

dotenv.config();

// Ensure JWT_SECRET is present in production configurations
if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL ERROR: JWT_SECRET environment variable is not defined!');
    process.exit(1);
  } else {
    console.warn('WARNING: JWT_SECRET environment variable is missing. Using development/testing fallback.');
  }
}

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for express-rate-limit on hosting platforms like Render
app.set('trust proxy', 1);

// Connect to MongoDB
connectDB();

// Security HTTP headers
app.use(helmet());

// Secure CORS setup
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',') 
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// JSON Parser
app.use(express.json());

// Input Sanitization (NoSQL injection and XSS defenses)
app.use(sanitizeNoSql);
app.use(sanitizeXSS);

// API Rate Limiting to prevent brute force and DDoS
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP. Please try again after 15 minutes.' }
});
app.use('/api/', apiLimiter);

// Mount Modular Routes
app.use('/api/auth', authRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/metrics', metricRoutes);

// Unmatched Route Handling (404)
app.use((req, res) => {
  res.status(404).json({ error: `Not Found: The endpoint '${req.originalUrl}' does not exist.` });
});

// Centralized Error Handler Middleware
app.use(errorHandler);

// Start the Express Server
app.listen(PORT, () => {
  console.log(`ArenaFlow Backend Server listening on http://localhost:${PORT}`);
});

export default app; // exported for supertest suite integrations
