import express from 'express';
import { authenticateUser } from '../middleware/auth';
import {
    getDashboardStats,
    getAllOrders,
    updateOrderStatus
} from '../controllers/adminController';

const router = express.Router();

// Ideally, check for admin privileges here
router.use(authenticateUser);

router.get('/stats', getDashboardStats);
router.get('/orders', getAllOrders);
router.put('/orders/:orderId', updateOrderStatus);

export default router;
