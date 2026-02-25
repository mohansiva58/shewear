import { Request, Response } from 'express';
import Sale from '../models/Sale';
import SaleMode from '../models/SaleMode';
import { getRedisClient } from '../config/redis';
import { uploadToCloudinary } from '../config/cloudinary';

const CACHE_TTL = 3600; // 1 hour

export const createSale = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('Creating sale - Request body:', req.body);
        const saleData = req.body;
        const files = (req as any).files as { [fieldname: string]: Express.Multer.File[] };
        console.log('Files received:', files ? Object.keys(files) : 'none');

        // Handle main image upload
        if (files?.image?.[0]) {
            try {
                console.log('Uploading main image to Cloudinary...');
                const imageUrl = await uploadToCloudinary(files.image[0].buffer);
                saleData.image = imageUrl;
                console.log('Main image uploaded:', imageUrl);
            } catch (uploadError) {
                console.error('Image upload failed:', uploadError);
                res.status(500).json({ error: 'Failed to upload main image' });
                return;
            }
        }

        // Handle additional images upload
        if (files?.images) {
            try {
                console.log(`Uploading ${files.images.length} additional images to Cloudinary...`);
                const uploadPromises = files.images.map((file: any) => uploadToCloudinary(file.buffer));
                const imageUrls = await Promise.all(uploadPromises);
                saleData.images = imageUrls;
                console.log('Additional images uploaded:', imageUrls);
            } catch (uploadError) {
                console.error('Additional images upload failed:', uploadError);
                res.status(500).json({ error: 'Failed to upload additional images' });
                return;
            }
        }

        // Parse sizes if it's coming as a string
        if (typeof saleData.sizes === 'string') {
            try {
                saleData.sizes = JSON.parse(saleData.sizes);
            } catch (e) {
                saleData.sizes = saleData.sizes.split(',').map((s: string) => s.trim());
            }
        }

        if (!Array.isArray(saleData.sizes) || saleData.sizes.length === 0) {
            console.error('Invalid sizes data:', saleData.sizes);
            res.status(400).json({ error: 'Sizes must be a non-empty array' });
            return;
        }

        saleData.sizes = saleData.sizes.filter((s: string) => s && s.trim().length > 0);

        if (saleData.sizes.length === 0) {
            console.error('No valid sizes after filtering');
            res.status(400).json({ error: 'At least one size is required' });
            return;
        }

        // Convert types
        saleData.price = Number(saleData.price);
        if (saleData.originalPrice) saleData.originalPrice = Number(saleData.originalPrice);
        if (saleData.stock) saleData.stock = Number(saleData.stock);
        if (saleData.discount) saleData.discount = Number(saleData.discount);

        // Validate required fields
        if (!saleData.name || !saleData.price || !saleData.category || !saleData.description) {
            console.error('Missing required fields');
            res.status(400).json({ error: 'Missing required fields: name, price, category, description, and image are required' });
            return;
        }

        if (!saleData.image) {
            console.error('No image URL');
            res.status(400).json({ error: 'Sale item image is required' });
            return;
        }

        // Generate ID if not provided
        if (!saleData.saleId) {
            saleData.saleId = 'SALE-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        }

        const newSale = await Sale.create(saleData);
        console.log('Sale item created successfully:', newSale.saleId);

        // Invalidate cache
        try {
            const redis = getRedisClient();
            const keys = await redis.keys('sales:*');
            if (keys.length > 0) {
                for (const key of keys) {
                    await redis.del(key);
                }
                console.log(`Invalidated ${keys.length} sale cache keys`);
            }
        } catch (cacheError) {
            console.warn('Redis cache invalidation failed:', cacheError);
        }

        res.status(201).json(newSale);
    } catch (error: any) {
        console.error('Create sale error:', error);
        if (error.name === 'ValidationError') {
            res.status(400).json({
                error: 'Validation failed',
                details: Object.keys(error.errors).map(key => ({
                    field: key,
                    message: error.errors[key].message
                }))
            });
        } else {
            res.status(500).json({ error: error.message || 'Failed to create sale item' });
        }
    }
};

export const getAllSales = async (req: Request, res: Response): Promise<void> => {
    try {
        const cacheKey = 'sales:all';

        // Try to get from cache
        try {
            const redis = getRedisClient();
            const cached = await redis.get(cacheKey);
            if (cached) {
                console.log('Returning cached sales');
                res.json(JSON.parse(cached));
                return;
            }
        } catch (cacheError) {
            console.warn('Redis cache miss:', cacheError);
        }

        const sales = await Sale.find({}).sort({ createdAt: -1 });

        console.log('getAllSales - Found', sales.length, 'sale items');

        try {
            const redis = getRedisClient();
            await redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(sales));
        } catch (cacheError) {
            console.warn('Redis cache set failed:', cacheError);
        }

        res.json(sales);
    } catch (error) {
        console.error('Get all sales error:', error);
        res.status(500).json({ error: 'Failed to fetch sales' });
    }
};

export const getActiveSales = async (_req: Request, res: Response): Promise<void> => {
    try {
        const cacheKey = 'sales:active';

        // Check if there's an active sale mode
        const activeSaleMode = await SaleMode.findOne({ isActive: true });

        if (!activeSaleMode) {
            console.log('No active sale mode');
            res.json([]);
            return;
        }

        try {
            const redis = getRedisClient();
            const cached = await redis.get(cacheKey);
            if (cached) {
                console.log('Returning cached active sales');
                res.json(JSON.parse(cached));
                return;
            }
        } catch (cacheError) {
            console.warn('Redis cache miss:', cacheError);
        }

        // Only fetch sales for the active sale mode
        const sales = await Sale.find({ saleMode: activeSaleMode.saleName }).sort({ createdAt: -1 });

        console.log('getActiveSales - Found', sales.length, 'sale items for active sale mode:', activeSaleMode.saleName);

        try {
            const redis = getRedisClient();
            await redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(sales));
        } catch (cacheError) {
            console.warn('Redis cache set failed:', cacheError);
        }

        res.json(sales);
    } catch (error) {
        console.error('Get active sales error:', error);
        res.status(500).json({ error: 'Failed to fetch active sales' });
    }
};

export const getSaleById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const cacheKey = `sale:${id}`;

        try {
            const redis = getRedisClient();
            const cached = await redis.get(cacheKey);
            if (cached) {
                res.json(JSON.parse(cached));
                return;
            }
        } catch (cacheError) {
            console.warn('Redis cache miss:', cacheError);
        }

        const sale = await Sale.findOne({ saleId: id });

        if (!sale) {
            const saleById = await Sale.findById(id);
            if (!saleById) {
                res.status(404).json({ error: 'Sale item not found' });
                return;
            }

            try {
                const redis = getRedisClient();
                await redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(saleById));
            } catch (cacheError) {
                console.warn('Redis cache set failed:', cacheError);
            }

            res.json(saleById);
            return;
        }

        try {
            const redis = getRedisClient();
            await redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(sale));
        } catch (cacheError) {
            console.warn('Redis cache set failed:', cacheError);
        }

        res.json(sale);
    } catch (error) {
        console.error('Get sale error:', error);
        res.status(500).json({ error: 'Failed to fetch sale item' });
    }
};

export const updateSale = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const files = (req as any).files as { [fieldname: string]: Express.Multer.File[] };

        // Handle image updates
        if (files?.image?.[0]) {
            try {
                const imageUrl = await uploadToCloudinary(files.image[0].buffer);
                updates.image = imageUrl;
            } catch (uploadError) {
                console.error('Image upload failed:', uploadError);
                res.status(500).json({ error: 'Failed to upload new image' });
                return;
            }
        }

        if (files?.images) {
            try {
                const uploadPromises = files.images.map((file: any) => uploadToCloudinary(file.buffer));
                const newImageUrls = await Promise.all(uploadPromises);
                updates.images = newImageUrls;
            } catch (uploadError) {
                console.error('Additional images upload failed:', uploadError);
            }
        }

        // Parse numeric fields
        if (updates.price) updates.price = Number(updates.price);
        if (updates.originalPrice) updates.originalPrice = Number(updates.originalPrice);
        if (updates.stock) updates.stock = Number(updates.stock);
        if (updates.discount) updates.discount = Number(updates.discount);
        if (updates.rating) updates.rating = Number(updates.rating);
        if (updates.reviews) updates.reviews = Number(updates.reviews);

        // Parse sizes
        if (updates.sizes && typeof updates.sizes === 'string') {
            try {
                updates.sizes = JSON.parse(updates.sizes);
            } catch (e) {
                updates.sizes = updates.sizes.split(',').map((s: string) => s.trim());
            }
        }

        const updatedSale = await Sale.findOneAndUpdate(
            { saleId: id },
            updates,
            { new: true }
        );

        if (!updatedSale) {
            const updatedSaleById = await Sale.findByIdAndUpdate(id, updates, { new: true });
            if (!updatedSaleById) {
                res.status(404).json({ error: 'Sale item not found' });
                return;
            }

            // Cache invalidation
            try {
                const redis = getRedisClient();
                const keys = await redis.keys('sales:*');
                if (keys.length > 0) {
                    for (const key of keys) {
                        await redis.del(key);
                    }
                }
                await redis.del(`sale:${updatedSaleById.saleId}`);
            } catch (cacheError) {
                console.warn('Redis cache invalidation failed');
            }
            res.json(updatedSaleById);
            return;
        }

        // Cache invalidation
        try {
            const redis = getRedisClient();
            const keys = await redis.keys('sales:*');
            if (keys.length > 0) {
                for (const key of keys) {
                    await redis.del(key);
                }
            }
            await redis.del(`sale:${id}`);
        } catch (cacheError) {
            console.warn('Redis cache invalidation failed');
        }

        res.json(updatedSale);
    } catch (error: any) {
        console.error('Update sale error:', error);
        res.status(500).json({ error: error.message || 'Failed to update sale item' });
    }
};

export const deleteSale = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const deletedSale = await Sale.findOneAndDelete({ saleId: id });

        if (!deletedSale) {
            const deletedById = await Sale.findByIdAndDelete(id);
            if (!deletedById) {
                res.status(404).json({ error: 'Sale item not found' });
                return;
            }

            // Cache invalidation
            try {
                const redis = getRedisClient();
                const keys = await redis.keys('sales:*');
                if (keys.length > 0) {
                    for (const key of keys) {
                        await redis.del(key);
                    }
                }
                await redis.del(`sale:${deletedById.saleId}`);
            } catch (cacheError) {
                console.warn('Redis cache invalidation failed');
            }
            res.json({ message: 'Sale item deleted successfully' });
            return;
        }

        // Cache invalidation
        try {
            const redis = getRedisClient();
            const keys = await redis.keys('sales:*');
            if (keys.length > 0) {
                for (const key of keys) {
                    await redis.del(key);
                }
            }
            await redis.del(`sale:${id}`);
        } catch (cacheError) {
            console.warn('Redis cache invalidation failed');
        }

        res.json({ message: 'Sale item deleted successfully' });
    } catch (error: any) {
        console.error('Delete sale error:', error);
        res.status(500).json({ error: error.message || 'Failed to delete sale item' });
    }
};

// Sale Mode Controllers
export const createOrUpdateSaleMode = async (req: Request, res: Response): Promise<void> => {
    try {
        const { saleName, isActive, description, startDate, endDate } = req.body;

        if (!saleName) {
            res.status(400).json({ error: 'Sale name is required' });
            return;
        }

        const saleMode = await SaleMode.findOneAndUpdate(
            { saleName },
            { saleName, isActive, description, startDate, endDate },
            { upsert: true, new: true }
        );

        console.log('Sale mode created/updated:', saleMode.saleName, 'Active:', saleMode.isActive);

        // Invalidate cache
        try {
            const redis = getRedisClient();
            await redis.del('sales:active');
        } catch (cacheError) {
            console.warn('Redis cache invalidation failed:', cacheError);
        }

        res.status(200).json(saleMode);
    } catch (error: any) {
        console.error('Create/Update sale mode error:', error);
        res.status(500).json({ error: error.message || 'Failed to create/update sale mode' });
    }
};

export const getAllSaleModes = async (_req: Request, res: Response): Promise<void> => {
    try {
        const saleModes = await SaleMode.find({}).sort({ createdAt: -1 });
        console.log('getAllSaleModes - Found', saleModes.length, 'sale modes');
        res.json(saleModes);
    } catch (error) {
        console.error('Get all sale modes error:', error);
        res.status(500).json({ error: 'Failed to fetch sale modes' });
    }
};

export const getActiveSaleMode = async (_req: Request, res: Response): Promise<void> => {
    try {
        const activeMode = await SaleMode.findOne({ isActive: true });

        if (!activeMode) {
            console.log('No active sale mode found');
            res.json(null);
            return;
        }

        console.log('Active sale mode:', activeMode.saleName);
        res.json(activeMode);
    } catch (error) {
        console.error('Get active sale mode error:', error);
        res.status(500).json({ error: 'Failed to fetch active sale mode' });
    }
};

export const toggleSaleMode = async (req: Request, res: Response): Promise<void> => {
    try {
        const { saleName } = req.params;

        // Deactivate all other sale modes
        await SaleMode.updateMany({ saleName: { $ne: saleName } }, { isActive: false });

        // Toggle the requested sale mode
        const saleMode = await SaleMode.findOneAndUpdate(
            { saleName },
            [{ $set: { isActive: { $not: '$isActive' } } }],
            { new: true }
        );

        if (!saleMode) {
            res.status(404).json({ error: 'Sale mode not found' });
            return;
        }

        console.log('Sale mode toggled:', saleMode.saleName, 'Active:', saleMode.isActive);

        // Invalidate cache
        try {
            const redis = getRedisClient();
            await redis.del('sales:active');
        } catch (cacheError) {
            console.warn('Redis cache invalidation failed:', cacheError);
        }

        res.json(saleMode);
    } catch (error: any) {
        console.error('Toggle sale mode error:', error);
        res.status(500).json({ error: error.message || 'Failed to toggle sale mode' });
    }
};

export const deleteSaleMode = async (req: Request, res: Response): Promise<void> => {
    try {
        const { saleName } = req.params;

        const deletedMode = await SaleMode.findOneAndDelete({ saleName });

        if (!deletedMode) {
            res.status(404).json({ error: 'Sale mode not found' });
            return;
        }

        console.log('Sale mode deleted:', saleName);

        // Invalidate cache
        try {
            const redis = getRedisClient();
            await redis.del('sales:active');
        } catch (cacheError) {
            console.warn('Redis cache invalidation failed:', cacheError);
        }

        res.json({ message: 'Sale mode deleted successfully' });
    } catch (error: any) {
        console.error('Delete sale mode error:', error);
        res.status(500).json({ error: error.message || 'Failed to delete sale mode' });
    }
};
