import express, { Application } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Import configurations
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
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

// Import middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app: Application = express();
const PORT = process.env.PORT || 5000;

// CORS - MUST BE BEFORE OTHER MIDDLEWARE
app.use((req, res, next) => {
    const origin = req.headers.origin;
    
    // Allow production frontend URL from environment variable
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

    // Handle preflight
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

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000, // Increased for development
    message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

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
    });
});

// API Routes
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize services and start server
const startServer = async () => {
    try {
        console.log('🚀 Starting She Wear Backend Server...\n');

        // Connect to MongoDB
        await connectDatabase();

        // Connect to Redis
        await connectRedis();

        // Initialize Firebase Admin (optional, won't crash if fails)
        try {
            initializeFirebase();
        } catch (error) {
            console.warn('⚠️  Firebase Admin initialization failed (optional service)');
        }

        // Initialize Razorpay
        initializeRazorpay();

        // Initialize Email Service
        initializeEmailService();

        // Start Express server
        app.listen(PORT, () => {
            console.log(`\n✅ Server is running on port ${PORT}`);
            console.log(`📱 API Base URL: http://localhost:${PORT}/api`);
            console.log(`🏥 Health Check: http://localhost:${PORT}/health\n`);
            console.log('📡 Available Endpoints:');
            console.log('   - GET    /api/products');
            console.log('   - GET    /api/products/featured');
            console.log('   - GET    /api/products/:id');
            console.log('   - GET    /api/cart');
            console.log('   - POST   /api/cart/add');
            console.log('   - PUT    /api/cart/update');
            console.log('   - DELETE /api/cart/remove/:productId/:size');
            console.log('   - DELETE /api/cart/clear');
            console.log('   - POST   /api/orders');
            console.log('   - GET    /api/orders');
            console.log('   - GET    /api/orders/:orderId');
            console.log('   - POST   /api/orders/:orderId/cancel');
            console.log('   - POST   /api/payment/create-order');
            console.log('   - POST   /api/payment/verify');
            console.log('   - GET    /api/users/me');
            console.log('   - POST   /api/users/addresses');
            console.log('   - PUT    /api/users/addresses/:addressId');
            console.log('   - DELETE /api/users/addresses/:addressId\n');
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    process.exit(0);
});

// Start the server
startServer();

export default app;
