import { Request, Response } from 'express';
import Product from '../models/Product';
import { cacheGet, cacheSet, cacheDel, cacheInvalidatePrefix, CACHE_TTL } from '../utils/cache';
import {
    handleImageUploads,
    parseSizes,
    parseCommonFields,
    validateRequiredItemFields,
    generateItemId,
    handleValidationError,
} from '../utils/itemHelpers';

/** Invalidate all product caches */
const invalidateProductCache = async (productId?: string) => {
    await cacheInvalidatePrefix('products:');
    if (productId) await cacheDel(`product:${productId}`);
};

export const createProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        const productData = req.body;
        const files = (req as any).files as { [fieldname: string]: Express.Multer.File[] };

        // Shared: upload images
        if (!(await handleImageUploads(files, productData, res))) return;

        // Shared: parse sizes
        if (!parseSizes(productData, res)) return;

        // Shared: convert types
        parseCommonFields(productData);
        productData.newArrival = productData.isNew === 'true' || productData.isNew === true || productData.newArrival === 'true' || productData.newArrival === true;
        delete productData.isNew;
        productData.isBestseller = productData.isBestseller === 'true' || productData.isBestseller === true;

        // Shared: validate
        if (!validateRequiredItemFields(productData, res)) return;

        if (!productData.productId) {
            productData.productId = generateItemId('PROD');
        }

        const newProduct = await Product.create(productData);

        // Shared: invalidate cache (uses SCAN, not KEYS)
        await invalidateProductCache();

        res.status(201).json(newProduct);
    } catch (error: any) {
        if (!handleValidationError(error, res)) {
            console.error('Create product error:', error);
            res.status(500).json({ error: error.message || 'Failed to create product' });
        }
    }
};

export const bulkCreateProducts = async (req: Request, res: Response): Promise<void> => {
    try {
        const products = req.body;

        if (!Array.isArray(products)) {
            res.status(400).json({ error: 'Input must be an array of products' });
            return;
        }

        const productsWithIds = products.map((p: any) => ({
            ...p,
            productId: p.productId || generateItemId('PROD'),
            newArrival: p.newArrival || p.isNew || false,
            isNew: undefined,
        }));

        const result = await Product.insertMany(productsWithIds);
        await invalidateProductCache();

        res.status(201).json({
            message: `Successfully created ${result.length} products`,
            products: result,
        });
    } catch (error: any) {
        console.error('Bulk create error:', error);
        res.status(500).json({ error: error.message || 'Failed to bulk create products' });
    }
};

export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
    try {
        const { category, minPrice, maxPrice, search, sort } = req.query;
        const query: any = {};

        if (category && category !== 'All') query.category = category;
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }
        if (search) query.$text = { $search: search as string };

        // Try cache
        const cacheKey = `products:${JSON.stringify(query)}:${sort || 'default'}`;
        const cached = await cacheGet(cacheKey);
        if (cached) { res.json(cached); return; }

        let sortOption: any = { createdAt: -1 };
        if (sort === 'price-asc') sortOption = { price: 1 };
        if (sort === 'price-desc') sortOption = { price: -1 };
        if (sort === 'rating') sortOption = { rating: -1 };
        if (sort === 'popular') sortOption = { reviews: -1 };

        const products = await Product.find(query).sort(sortOption).lean(); // .lean() = faster, no Mongoose overhead

        await cacheSet(cacheKey, products, CACHE_TTL.PRODUCTS);
        res.json(products);
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
};

export const getProductById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const cacheKey = `product:${id}`;

        const cached = await cacheGet(cacheKey);
        if (cached) { res.json(cached); return; }

        const product = await Product.findOne({ productId: id }).lean();
        if (!product) { res.status(404).json({ error: 'Product not found' }); return; }

        await cacheSet(cacheKey, product, CACHE_TTL.PRODUCTS);
        res.json(product);
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
};

export const getFeaturedProducts = async (_req: Request, res: Response): Promise<void> => {
    try {
        const cacheKey = 'products:featured';
        const cached = await cacheGet(cacheKey);
        if (cached) { res.json(cached); return; }

        const products = await Product.find({}).limit(4).sort({ createdAt: -1 }).lean();
        await cacheSet(cacheKey, products, CACHE_TTL.PRODUCTS);
        res.json(products);
    } catch (error) {
        console.error('Get featured products error:', error);
        res.status(500).json({ error: 'Failed to fetch featured products' });
    }
};

export const updateProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const files = (req as any).files as { [fieldname: string]: Express.Multer.File[] };

        // Shared: upload images
        if (!(await handleImageUploads(files, updates, res))) return;

        // Shared: parse fields
        parseCommonFields(updates);
        if (typeof updates.isNew !== 'undefined') {
            updates.newArrival = updates.isNew === 'true' || updates.isNew === true;
            delete updates.isNew;
        }
        if (typeof updates.isBestseller !== 'undefined') {
            updates.isBestseller = updates.isBestseller === 'true' || updates.isBestseller === true;
        }
        if (updates.sizes && typeof updates.sizes === 'string') {
            try { updates.sizes = JSON.parse(updates.sizes); } catch { updates.sizes = updates.sizes.split(',').map((s: string) => s.trim()); }
        }

        // Try productId first, fallback to _id
        let updated = await Product.findOneAndUpdate({ productId: id }, updates, { new: true });
        if (!updated) updated = await Product.findByIdAndUpdate(id, updates, { new: true });
        if (!updated) { res.status(404).json({ error: 'Product not found' }); return; }

        await invalidateProductCache(id);
        res.json(updated);
    } catch (error: any) {
        console.error('Update product error:', error);
        res.status(500).json({ error: error.message || 'Failed to update product' });
    }
};

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        let deleted = await Product.findOneAndDelete({ productId: id });
        if (!deleted) deleted = await Product.findByIdAndDelete(id);
        if (!deleted) { res.status(404).json({ error: 'Product not found' }); return; }

        await invalidateProductCache(id);
        res.json({ message: 'Product deleted successfully' });
    } catch (error: any) {
        console.error('Delete product error:', error);
        res.status(500).json({ error: error.message || 'Failed to delete product' });
    }
};
