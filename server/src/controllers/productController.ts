import { Request, Response } from 'express';
import Product from '../models/Product';
import { getRedisClient } from '../config/redis';
import { uploadToCloudinary } from '../config/cloudinary';

const CACHE_TTL = 3600; // 1 hour

export const createProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('Creating product - Request body:', req.body);
        const productData = req.body;
        // Cast req to any to access files, or define a custom interface
        const files = (req as any).files as { [fieldname: string]: Express.Multer.File[] };
        console.log('Files received:', files ? Object.keys(files) : 'none');

        // Handle main image upload
        if (files?.image?.[0]) {
            try {
                console.log('Uploading main image to Cloudinary...');
                const imageUrl = await uploadToCloudinary(files.image[0].buffer);
                productData.image = imageUrl;
                console.log('Main image uploaded:', imageUrl);
            } catch (uploadError) {
                console.error('Image upload failed:', uploadError);
                res.status(500).json({ error: 'Failed to upload main image' });
                return;
            }
        } else {
            console.log('No main image file received');
        }

        // Handle additional images upload
        if (files?.images) {
            try {
                console.log(`Uploading ${files.images.length} additional images to Cloudinary...`);
                const uploadPromises = files.images.map((file: any) => uploadToCloudinary(file.buffer));
                const imageUrls = await Promise.all(uploadPromises);
                productData.images = imageUrls;
                console.log('Additional images uploaded:', imageUrls);
            } catch (uploadError) {
                console.error('Additional images upload failed:', uploadError);
                // Continue with just main image or fail? fail for now to be safe
                res.status(500).json({ error: 'Failed to upload additional images' });
                return;
            }
        }

        // Parse sizes if it's coming as a string (from FormData)
        if (typeof productData.sizes === 'string') {
            try {
                productData.sizes = JSON.parse(productData.sizes);
            } catch (e) {
                productData.sizes = productData.sizes.split(',').map((s: string) => s.trim());
            }
        }

        console.log('Parsed sizes:', productData.sizes);

        // Ensure sizes is an array and has at least one element
        if (!Array.isArray(productData.sizes) || productData.sizes.length === 0) {
            console.error('Invalid sizes data:', productData.sizes);
            res.status(400).json({ error: 'Sizes must be a non-empty array' });
            return;
        }

        // Filter out empty strings from sizes
        productData.sizes = productData.sizes.filter((s: string) => s && s.trim().length > 0);

        // Validate that we have at least one size after filtering
        if (productData.sizes.length === 0) {
            console.error('No valid sizes after filtering');
            res.status(400).json({ error: 'At least one size is required' });
            return;
        }

        // Convert types
        productData.price = Number(productData.price);
        if (productData.originalPrice) productData.originalPrice = Number(productData.originalPrice);
        if (productData.stock) productData.stock = Number(productData.stock);
        productData.newArrival = productData.isNew === 'true' || productData.isNew === true || productData.newArrival === 'true' || productData.newArrival === true;
        // Clean up old key if present
        delete productData.isNew;

        productData.isBestseller = productData.isBestseller === 'true' || productData.isBestseller === true;

        // Validate required fields before database insertion
        if (!productData.name || !productData.price || !productData.category || !productData.description) {
            console.error('Missing required fields:', { 
                name: !!productData.name, 
                price: !!productData.price, 
                category: !!productData.category, 
                description: !!productData.description,
                image: !!productData.image
            });
            res.status(400).json({ error: 'Missing required fields: name, price, category, description, and image are required' });
            return;
        }

        if (!productData.image) {
            console.error('No image URL - image upload may have failed');
            res.status(400).json({ error: 'Product image is required' });
            return;
        }

        // Generate ID if not provided (simple random ID for now)
        if (!productData.productId) {
            productData.productId = 'PROD-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        }

        console.log('Product data before save:', {
            ...productData,
            image: productData.image ? 'URL_PROVIDED' : 'MISSING',
            images: productData.images ? `${productData.images.length} images` : 'none'
        });

        const newProduct = await Product.create(productData);
        console.log('Product created successfully:', newProduct.productId);

        // Invalidate cache
        try {
            const redis = getRedisClient();
            // Delete all product-related cache keys
            const keys = await redis.keys('products:*');
            if (keys.length > 0) {
                for (const key of keys) {
                    await redis.del(key);
                }
                console.log(`Invalidated ${keys.length} product cache keys`);
            }
        } catch (cacheError) {
            console.warn('Redis cache invalidation failed:', cacheError);
        }

        res.status(201).json(newProduct);
    } catch (error: any) {
        console.error('Create product error:', error);
        console.error('Error stack:', error.stack);
        if (error.name === 'ValidationError') {
            console.error('Validation errors:', error.errors);
            res.status(400).json({ 
                error: 'Validation failed', 
                details: Object.keys(error.errors).map(key => ({
                    field: key,
                    message: error.errors[key].message
                }))
            });
        } else {
            res.status(500).json({ error: error.message || 'Failed to create product' });
        }
    }
};

export const bulkCreateProducts = async (req: Request, res: Response): Promise<void> => {
    try {
        const products = req.body; // Expects JSON array

        if (!Array.isArray(products)) {
            res.status(400).json({ error: 'Input must be an array of products' });
            return;
        }

        // Add IDs if missing and rename isNew to newArrival
        const productsWithIds = products.map((p: any) => {
            const newP = {
                ...p,
                productId: p.productId || 'PROD-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
                newArrival: p.newArrival || p.isNew || false
            };
            delete newP.isNew;
            return newP;
        });

        const result = await Product.insertMany(productsWithIds);

        // Invalidate cache
        try {
            const redis = getRedisClient();
            await redis.del('products:featured');
        } catch (cacheError) {
            console.warn('Cache invalidation failed');
        }

        res.status(201).json({
            message: `Successfully created ${result.length} products`,
            products: result
        });
    } catch (error: any) {
        console.error('Bulk create error:', error);
        res.status(500).json({ error: error.message || 'Failed to bulk create products' });
    }
};

export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
    try {
        const { category, minPrice, maxPrice, search, sort } = req.query;

        // Build query
        const query: any = {};

        if (category && category !== 'All') {
            query.category = category;
        }

        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        if (search) {
            query.$text = { $search: search as string };
        }

        // Try to get from cache
        const cacheKey = `products:${JSON.stringify(query)}:${sort || 'default'}`;
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

        // Sort options
        let sortOption: any = { createdAt: -1 };
        if (sort === 'price-asc') sortOption = { price: 1 };
        if (sort === 'price-desc') sortOption = { price: -1 };
        if (sort === 'rating') sortOption = { rating: -1 };
        if (sort === 'popular') sortOption = { reviews: -1 };

        const products = await Product.find(query).sort(sortOption);

        // Log image URLs for debugging
        console.log(`Retrieved ${products.length} products`);
        products.forEach((p) => {
            if (!p.image) {
                console.warn('Product missing image:', p.name);
            }
        });

        // Cache the results
        try {
            const redis = getRedisClient();
            await redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(products));
        } catch (cacheError) {
            console.warn('Redis cache set failed:', cacheError);
        }

        res.json(products);
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
};

export const getProductById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // Try cache first
        const cacheKey = `product:${id}`;
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

        const product = await Product.findOne({ productId: id });

        if (!product) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }

        // Debug: Log all product images
        console.log(`getProductById - Product: ${product.name}`);
        console.log(`  Total images: ${product.images ? product.images.length : 0}`);
        if (product.images) {
            product.images.forEach((img, idx) => {
                console.log(`    Image ${idx + 1}: ${img}`);
            });
        }
        console.log(`  Main image: ${product.image}`);

        // Cache the result
        try {
            const redis = getRedisClient();
            await redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(product));
        } catch (cacheError) {
            console.warn('Redis cache set failed:', cacheError);
        }

        res.json(product);
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
};

export const getFeaturedProducts = async (_req: Request, res: Response): Promise<void> => {
    try {
        const cacheKey = 'products:featured';

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

        const products = await Product.find({})
            .limit(4)
            .sort({ createdAt: -1 });

        console.log('getFeaturedProducts - Found', products.length, 'products');
        products.forEach(p => {
            console.log('Product:', p.name, 'ID:', p.productId, 'Image:', p.image ? 'YES' : 'NO');
        });

        try {
            const redis = getRedisClient();
            await redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(products));
        } catch (cacheError) {
            console.warn('Redis cache set failed:', cacheError);
        }

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
                // Append or replace? Let's assume replace if provided, or handle partial updates differently.
                // For now, if images are provided, replace.
                updates.images = newImageUrls;
            } catch (uploadError) {
                console.error('Additional images upload failed:', uploadError);
            }
        }

        // Parse numeric/boolean fields
        if (updates.price) updates.price = Number(updates.price);
        if (updates.originalPrice) updates.originalPrice = Number(updates.originalPrice);
        if (updates.stock) updates.stock = Number(updates.stock);
        if (updates.rating) updates.rating = Number(updates.rating);
        if (updates.reviews) updates.reviews = Number(updates.reviews);

        if (typeof updates.isNew !== 'undefined') {
            updates.newArrival = updates.isNew === 'true' || updates.isNew === true;
            delete updates.isNew;
        }
        if (typeof updates.isBestseller !== 'undefined') {
            updates.isBestseller = updates.isBestseller === 'true' || updates.isBestseller === true;
        }

        // Parse sizes
        if (updates.sizes && typeof updates.sizes === 'string') {
            try {
                updates.sizes = JSON.parse(updates.sizes);
            } catch (e) {
                updates.sizes = updates.sizes.split(',').map((s: string) => s.trim());
            }
        }

        const updatedProduct = await Product.findOneAndUpdate(
            { productId: id }, // changing to findOneAndUpdate by productId as ID seems to be productId
            updates,
            { new: true } // return updated doc
        );

        if (!updatedProduct) {
            // Try find by _id if productId fails
            const updatedProductById = await Product.findByIdAndUpdate(id, updates, { new: true });
            if (!updatedProductById) {
                res.status(404).json({ error: 'Product not found' });
                return;
            }
            // Cache invalidation
            try {
                const redis = getRedisClient();
                const keys = await redis.keys('products:*');
                if (keys.length > 0) {
                    for (const key of keys) {
                        await redis.del(key);
                    }
                }
                await redis.del(`product:${updatedProductById.productId}`);
            } catch (cacheError) {
                console.warn('Redis cache invalidation failed');
            }
            res.json(updatedProductById);
            return;
        }

        // Cache invalidation
        try {
            const redis = getRedisClient();
            const keys = await redis.keys('products:*');
            if (keys.length > 0) {
                for (const key of keys) {
                    await redis.del(key);
                }
            }
            await redis.del(`product:${id}`);
        } catch (cacheError) {
            console.warn('Redis cache invalidation failed');
        }

        res.json(updatedProduct);
    } catch (error: any) {
        console.error('Update product error:', error);
        res.status(500).json({ error: error.message || 'Failed to update product' });
    }
};

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const deletedProduct = await Product.findOneAndDelete({ productId: id });

        if (!deletedProduct) {
            // Try by _id
            const deletedById = await Product.findByIdAndDelete(id);
            if (!deletedById) {
                res.status(404).json({ error: 'Product not found' });
                return;
            }
            // Cache invalidation
            try {
                const redis = getRedisClient();
                const keys = await redis.keys('products:*');
                if (keys.length > 0) {
                    for (const key of keys) {
                        await redis.del(key);
                    }
                }
                await redis.del(`product:${deletedById.productId}`);
            } catch (cacheError) {
                console.warn('Redis cache invalidation failed');
            }
            res.json({ message: 'Product deleted successfully' });
            return;
        }

        // Cache invalidation
        try {
            const redis = getRedisClient();
            const keys = await redis.keys('products:*');
            if (keys.length > 0) {
                for (const key of keys) {
                    await redis.del(key);
                }
            }
            await redis.del(`product:${id}`);
        } catch (cacheError) {
            console.warn('Redis cache invalidation failed');
        }

        res.json({ message: 'Product deleted successfully' });
    } catch (error: any) {
        console.error('Delete product error:', error);
        res.status(500).json({ error: error.message || 'Failed to delete product' });
    }
};
