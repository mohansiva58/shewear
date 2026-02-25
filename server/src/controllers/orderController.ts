import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Order from '../models/Order';
import Cart from '../models/Cart';
import { generateOrderId, calculateShipping } from '../utils/helpers';
import { sendOrderConfirmationEmail } from '../config/email';
import { cacheDel } from '../utils/cache';

export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.uid;
        const userEmail = req.user?.email;

        if (!userId || !userEmail) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const {
            items,
            shippingAddress,
            paymentMethod,
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
        } = req.body;

        console.log('Creating order with items:', JSON.stringify(items, null, 2));

        // Validation
        if (!items || items.length === 0) {
            res.status(400).json({ error: 'Order items are required' });
            return;
        }

        if (!shippingAddress) {
            res.status(400).json({ error: 'Shipping address is required' });
            return;
        }

        if (!paymentMethod || !['razorpay', 'cod'].includes(paymentMethod)) {
            res.status(400).json({ error: 'Valid payment method is required' });
            return;
        }

        // Calculate totals
        const subtotal = items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
        const shipping = calculateShipping(subtotal);
        const total = subtotal + shipping;

        // Determine payment status
        let paymentStatus: 'pending' | 'paid' | 'failed' | 'cod' = 'pending';
        if (paymentMethod === 'cod') {
            paymentStatus = 'cod';
        } else if (paymentMethod === 'razorpay' && razorpayPaymentId) {
            paymentStatus = 'paid';
        }

        // Create order
        const orderId = generateOrderId();
        const order = await Order.create({
            orderId,
            userId,
            userEmail,
            items,
            shippingAddress,
            subtotal,
            shipping,
            total,
            paymentMethod,
            paymentStatus,
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
            orderStatus: 'confirmed',
            estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        });

        // Clear cart after successful order
        try {
            await Cart.findOneAndUpdate({ userId }, { items: [] });
            await cacheDel(`cart:${userId}`);
        } catch (cartError) {
            console.warn('Failed to clear cart:', cartError);
        }

        // Send order confirmation email
        try {
            await sendOrderConfirmationEmail({
                customerName: shippingAddress.fullName,
                customerEmail: shippingAddress.email || userEmail,
                orderId: order.orderId,
                orderDate: order.createdAt,
                items: order.items.map((item) => ({
                    name: item.name,
                    size: item.size,
                    quantity: item.quantity,
                    price: item.price * item.quantity,
                })),
                subtotal: order.subtotal,
                shipping: order.shipping,
                total: order.total,
                paymentMethod: paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment',
                shippingAddress: order.shippingAddress,
            });
        } catch (emailError) {
            console.error('Failed to send order confirmation email:', emailError);
            // Don't fail the order if email fails
        }

        res.status(201).json({
            success: true,
            order: {
                orderId: order.orderId,
                orderStatus: order.orderStatus,
                paymentStatus: order.paymentStatus,
                total: order.total,
                estimatedDelivery: order.estimatedDelivery,
            },
        });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ error: 'Failed to create order', details: (error as Error).message });
    }
};

export const getOrders = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { status, limit = 20, page = 1 } = req.query;

        const query: any = { userId };
        if (status && status !== 'all') {
            query.orderStatus = status;
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [orders, total] = await Promise.all([
            Order.find(query)
                .sort({ createdAt: -1 })
                .limit(Number(limit))
                .skip(skip),
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
        console.error('Get orders error:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
};

export const getOrderById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { orderId } = req.params;

        const order = await Order.findOne({ orderId, userId });

        if (!order) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }

        res.json(order);
    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
};

export const cancelOrder = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { orderId } = req.params;
        const { reason } = req.body;

        const order = await Order.findOne({ orderId, userId });

        if (!order) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }

        // Only allow cancellation if order is not shipped
        if (['shipped', 'delivered', 'cancelled'].includes(order.orderStatus)) {
            res.status(400).json({
                error: `Cannot cancel order with status: ${order.orderStatus}`
            });
            return;
        }

        order.orderStatus = 'cancelled';
        order.cancelledAt = new Date();
        order.cancellationReason = reason;

        await order.save();

        res.json({
            success: true,
            message: 'Order cancelled successfully',
            order,
        });
    } catch (error) {
        console.error('Cancel order error:', error);
        res.status(500).json({ error: 'Failed to cancel order' });
    }
};
