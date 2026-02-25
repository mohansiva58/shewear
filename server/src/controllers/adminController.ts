import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Order from '../models/Order';
import User from '../models/User';

export const getDashboardStats = async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
        // Use Promise.all for parallel execution (faster with 100+ users)
        const [totalUsers, totalOrders, revenueResult, recentOrders] = await Promise.all([
            User.countDocuments(),
            Order.countDocuments(),
            // Use MongoDB aggregation instead of loading ALL orders into memory!
            // Old code: `Order.find()` then JS reduce — would OOM with thousands of orders
            Order.aggregate([
                {
                    $match: {
                        $or: [
                            { paymentStatus: 'paid' },
                            { orderStatus: 'delivered' },
                        ],
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: '$total' },
                    },
                },
            ]),
            Order.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .lean(),
        ]);

        const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

        res.json({
            totalUsers,
            totalOrders,
            totalRevenue,
            recentOrders,
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
};

export const getAllOrders = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // Add pagination — old code loaded ALL orders at once (memory bomb)
        const { page = 1, limit = 50, status } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const query: any = {};
        if (status && status !== 'all') query.orderStatus = status;

        const [orders, total] = await Promise.all([
            Order.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            Order.countDocuments(query),
        ]);

        res.json({
            orders,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / Number(limit)),
            },
        });
    } catch (error) {
        console.error('Get all orders error:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        const order = await Order.findOne({ orderId });
        if (!order) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }

        order.orderStatus = status;
        if (status === 'delivered') {
            order.paymentStatus = 'paid'; // Assume COD is paid on delivery
        }
        await order.save();
        res.json(order);
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ error: 'Failed to update order status' });
    }
};
