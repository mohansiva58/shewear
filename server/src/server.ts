import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Import configurations
import { connectDatabase, disconnectDatabase } from './config/database';
import { connectRedis, disconnectRedis } from './config/redis';
import { initializeFirebase } from './config/firebase';
import { initializeRazorpay } from './config/razorpay';
import { initializeEmailService } from './config/email';

// Import routes
import productRoutes from './routes/products';
import cartRoutes from './routes/cart';
import orderRoutes from './routes/orders';
import paymentRoutes from './routes/payment';
import userRoutes from './routes/users';
import adminRoutes from './routes/admin';
import salesRoutes from './routes/sales';

// Import middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const PORT = process.env.PORT || 5000;

function createApp(): Application {
    const app: Application = express();

    // CORS - MUST BE BEFORE OTHER MIDDLEWARE
    app.use((req, res, next) => {
        const origin = req.headers.origin;
        const productionOrigin = process.env.FRONTEND_URL || process.env.CORS_ORIGIN;

        const allowedOrigins = [
            'http://localhost:5173',
            'http://localhost:5174',
            'http://localhost:3000',
            'http://localhost:8080',
            'http://localhost:8081',
            'http://localhost:8082',
            ...(productionOrigin ? [productionOrigin] : []),
        ];

        if (origin && allowedOrigins.includes(origin)) {
            res.setHeader('Access-Control-Allow-Origin', origin);
        } else if (process.env.NODE_ENV === 'production' && productionOrigin) {
            res.setHeader('Access-Control-Allow-Origin', productionOrigin);
        } else {
            res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080');
        }

        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        res.setHeader('Access-Control-Expose-Headers', 'set-cookie');

        if (req.method === 'OPTIONS') {
            res.sendStatus(204);
            return;
        }

        next();
    });

    // Security middleware
    app.use(helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" }
    }));

    // ============ RATE LIMITING (per-route) ============
    // Separate limits prevent product browsing from blocking checkout/payment
    const generalLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 1000,
        message: 'Too many requests from this IP, please try again later.',
        standardHeaders: true,
        legacyHeaders: false,
    });

    const authLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 50,
        message: 'Too many authentication attempts, please try again later.',
        standardHeaders: true,
        legacyHeaders: false,
    });

    const paymentLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 30,
        message: 'Too many payment attempts, please try again later.',
        standardHeaders: true,
        legacyHeaders: false,
    });

    app.use('/api/payment', paymentLimiter);
    app.use('/api/users', authLimiter);
    app.use('/api/', generalLimiter);

    // Body parsing middleware
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Compression middleware
    app.use(compression());

    // Request timeout — prevents hanging requests from consuming connections
    app.use((req: Request, _res: Response, next: NextFunction) => {
        req.setTimeout(30000); // 30 seconds
        next();
    });

    // Logging middleware
    if (process.env.NODE_ENV === 'development') {
        app.use(morgan('dev'));
    } else {
        app.use(morgan('combined'));
    }

    // Health check endpoint
    app.get('/health', (_req, res) => {
        res.json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            pid: process.pid,
        });
    });

    // API Routes
    app.use('/api/products', productRoutes);
    app.use('/api/cart', cartRoutes);
    app.use('/api/orders', orderRoutes);
    app.use('/api/payment', paymentRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/sales', salesRoutes);

    // Error handling
    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
}

async function startWorker() {
    const app = createApp();

    try {
        console.log(`🚀 Starting She Wear Backend Server (PID: ${process.pid})...\n`);

        // Connect to MongoDB (required — server can't work without DB)
        await connectDatabase();

        // Connect to Redis (optional — server works without cache, just slower)
        await connectRedis();

        // Initialize Firebase Admin (optional)
        try {
            initializeFirebase();
        } catch (error) {
            console.warn('⚠️  Firebase Admin initialization failed (optional service)');
        }

        // Initialize Razorpay (optional — fails gracefully)
        try {
            initializeRazorpay();
        } catch (error) {
            console.warn('⚠️  Razorpay initialization failed:', (error as Error).message);
        }

        // Initialize Email Service (optional — fails gracefully)
        try {
            initializeEmailService();
        } catch (error) {
            console.warn('⚠️  Email service initialization failed:', (error as Error).message);
        }

        // Start Express server
        const server = app.listen(PORT, () => {
            console.log(`\n✅ Server running on port ${PORT}`);
            console.log(`📱 API Base URL: http://localhost:${PORT}/api`);
            console.log(`🏥 Health Check: http://localhost:${PORT}/health\n`);
        });

        // Server-level timeout (safety net)
        server.timeout = 30000;
        server.keepAliveTimeout = 65000;
        server.headersTimeout = 66000;

        // ============ GRACEFUL SHUTDOWN ============
        const gracefulShutdown = async (signal: string) => {
            console.log(`\n${signal} received. Shutting down gracefully...`);
            
            server.close(async () => {
                console.log('HTTP server closed');
                try {
                    await disconnectDatabase();
                    await disconnectRedis();
                } catch (err) {
                    console.error('Error during cleanup:', err);
                }
                process.exit(0);
            });

            setTimeout(() => {
                console.error('Forced shutdown after 10s timeout');
                process.exit(1);
            }, 10000);
        };

        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Start the server
startWorker();

export default createApp;
