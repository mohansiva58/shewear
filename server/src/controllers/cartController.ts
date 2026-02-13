import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Cart from '../models/Cart';
import Product from '../models/Product';
import { getRedisClient } from '../config/redis';

const CART_CACHE_TTL = 1800; // 30 minutes

const getCacheKey = (userId: string) => `cart:${userId}`;

export const getCart = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        // Try Redis cache first
        try {
            const redis = getRedisClient();
            const cached = await redis.get(getCacheKey(userId));
            if (cached) {
                res.json(JSON.parse(cached));
                return;
            }
        } catch (cacheError) {
            console.warn('Redis cache miss:', cacheError);
        }

        // Get from MongoDB
        let cart = await Cart.findOne({ userId });

        if (!cart) {
            cart = await Cart.create({ userId, items: [] });
        }

        // Cache it
        try {
            const redis = getRedisClient();
            await redis.setEx(getCacheKey(userId), CART_CACHE_TTL, JSON.stringify(cart));
        } catch (cacheError) {
            console.warn('Redis cache set failed:', cacheError);
        }

        res.json(cart);
    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({ error: 'Failed to fetch cart' });
    }
};

export const addToCart = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { productId, size, quantity = 1 } = req.body;

        if (!productId || !size) {
            res.status(400).json({ error: 'Product ID and size are required' });
            return;
        }

        // Verify product exists
        const product = await Product.findOne({ productId });
        if (!product) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }

        // Get or create cart
        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = new Cart({ userId, items: [] });
        }

        // Check if item already exists
        const existingItemIndex = cart.items.findIndex(
            (item) => item.productId === productId && item.size === size
        );

        if (existingItemIndex > -1) {
            // Update quantity
            cart.items[existingItemIndex].quantity += quantity;
        } else {
            // Add new item
            cart.items.push({
                productId,
                name: product.name,
                price: product.price,
                image: product.image,
                size,
                quantity,
            });
        }

        await cart.save();

        // Update cache
        try {
            const redis = getRedisClient();
            await redis.setEx(getCacheKey(userId), CART_CACHE_TTL, JSON.stringify(cart));
        } catch (cacheError) {
            console.warn('Redis cache update failed:', cacheError);
        }

        res.json(cart);
    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({ error: 'Failed to add item to cart' });
    }
};

export const updateCartItem = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { productId, size, quantity } = req.body;

        if (!productId || !size || quantity === undefined) {
            res.status(400).json({ error: 'Product ID, size, and quantity are required' });
            return;
        }

        if (quantity < 1) {
            res.status(400).json({ error: 'Quantity must be at least 1' });
            return;
        }

        const cart = await Cart.findOne({ userId });
        if (!cart) {
            res.status(404).json({ error: 'Cart not found' });
            return;
        }

        const itemIndex = cart.items.findIndex(
            (item) => item.productId === productId && item.size === size
        );

        if (itemIndex === -1) {
            res.status(404).json({ error: 'Item not found in cart' });
            return;
        }

        cart.items[itemIndex].quantity = quantity;
        await cart.save();

        // Update cache
        try {
            const redis = getRedisClient();
            await redis.setEx(getCacheKey(userId), CART_CACHE_TTL, JSON.stringify(cart));
        } catch (cacheError) {
            console.warn('Redis cache update failed:', cacheError);
        }

        res.json(cart);
    } catch (error) {
        console.error('Update cart error:', error);
        res.status(500).json({ error: 'Failed to update cart' });
    }
};

export const removeFromCart = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { productId, size } = req.params;

        const cart = await Cart.findOne({ userId });
        if (!cart) {
            res.status(404).json({ error: 'Cart not found' });
            return;
        }

        cart.items = cart.items.filter(
            (item) => !(item.productId === productId && item.size === size)
        );

        await cart.save();

        // Update cache
        try {
            const redis = getRedisClient();
            await redis.setEx(getCacheKey(userId), CART_CACHE_TTL, JSON.stringify(cart));
        } catch (cacheError) {
            console.warn('Redis cache update failed:', cacheError);
        }

        res.json(cart);
    } catch (error) {
        console.error('Remove from cart error:', error);
        res.status(500).json({ error: 'Failed to remove item from cart' });
    }
};

export const clearCart = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const cart = await Cart.findOne({ userId });
        if (cart) {
            cart.items = [];
            await cart.save();
        }

        // Clear cache
        try {
            const redis = getRedisClient();
            await redis.del(getCacheKey(userId));
        } catch (cacheError) {
            console.warn('Redis cache clear failed:', cacheError);
        }

        res.json({ message: 'Cart cleared successfully' });
    } catch (error) {
        console.error('Clear cart error:', error);
        res.status(500).json({ error: 'Failed to clear cart' });
    }
};
