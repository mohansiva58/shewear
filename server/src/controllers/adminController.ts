import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Order from '../models/Order';
import User from '../models/User';

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const totalUsers = await User.countDocuments();
        const totalOrders = await Order.countDocuments();

        const orders = await Order.find();
        const totalRevenue = orders.reduce((sum, order) => {
            if (order.paymentStatus === 'paid' || order.orderStatus === 'delivered') {
                return sum + order.total;
            }
            return sum;
        }, 0);

        const recentOrders = await Order.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('userId', 'displayName email');

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
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
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
