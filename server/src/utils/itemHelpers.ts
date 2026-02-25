import { Response } from 'express';
import { uploadToCloudinary } from '../config/cloudinary';

/**
 * Shared utilities for product/sale creation — eliminates 80% duplicate code
 * between productController and saleController.
 */

/** Upload main image + additional images from multipart form. Returns false if failed (response already sent). */
export const handleImageUploads = async (
    files: { [fieldname: string]: Express.Multer.File[] } | undefined,
    data: any,
    res: Response
): Promise<boolean> => {
    // Handle main image upload
    if (files?.image?.[0]) {
        try {
            data.image = await uploadToCloudinary(files.image[0].buffer);
        } catch (uploadError) {
            console.error('Image upload failed:', uploadError);
            res.status(500).json({ error: 'Failed to upload main image' });
            return false;
        }
    }

    // Handle additional images upload
    if (files?.images) {
        try {
            const uploadPromises = files.images.map((file: any) => uploadToCloudinary(file.buffer));
            data.images = await Promise.all(uploadPromises);
        } catch (uploadError) {
            console.error('Additional images upload failed:', uploadError);
            res.status(500).json({ error: 'Failed to upload additional images' });
            return false;
        }
    }

    return true;
};

/** Parse sizes from string (FormData) to array. Returns false if invalid (response already sent). */
export const parseSizes = (data: any, res: Response): boolean => {
    if (typeof data.sizes === 'string') {
        try {
            data.sizes = JSON.parse(data.sizes);
        } catch {
            data.sizes = data.sizes.split(',').map((s: string) => s.trim());
        }
    }

    if (!Array.isArray(data.sizes) || data.sizes.length === 0) {
        res.status(400).json({ error: 'Sizes must be a non-empty array' });
        return false;
    }

    data.sizes = data.sizes.filter((s: string) => s && s.trim().length > 0);

    if (data.sizes.length === 0) {
        res.status(400).json({ error: 'At least one size is required' });
        return false;
    }

    return true;
};

/** Convert common numeric/boolean fields from FormData strings. */
export const parseCommonFields = (data: any): void => {
    if (data.price) data.price = Number(data.price);
    if (data.originalPrice) data.originalPrice = Number(data.originalPrice);
    if (data.stock) data.stock = Number(data.stock);
    if (data.rating) data.rating = Number(data.rating);
    if (data.reviews) data.reviews = Number(data.reviews);
    if (data.discount) data.discount = Number(data.discount);
};

/** Validate required fields for product/sale creation. Returns false if invalid (response already sent). */
export const validateRequiredItemFields = (data: any, res: Response): boolean => {
    if (!data.name || !data.price || !data.category || !data.description) {
        res.status(400).json({
            error: 'Missing required fields: name, price, category, description, and image are required',
        });
        return false;
    }

    if (!data.image) {
        res.status(400).json({ error: 'Image is required' });
        return false;
    }

    return true;
};

/** Generate a unique ID with a given prefix. */
export const generateItemId = (prefix: string): string => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

/** Handle Mongoose validation errors. Returns true if it was a validation error (response already sent). */
export const handleValidationError = (error: any, res: Response): boolean => {
    if (error.name === 'ValidationError') {
        res.status(400).json({
            error: 'Validation failed',
            details: Object.keys(error.errors).map((key) => ({
                field: key,
                message: error.errors[key].message,
            })),
        });
        return true;
    }
    return false;
};
