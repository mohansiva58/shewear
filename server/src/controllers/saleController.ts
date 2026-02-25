import { Request, Response } from 'express';
import Sale from '../models/Sale';
import SaleMode from '../models/SaleMode';
import { cacheGet, cacheSet, cacheDel, cacheInvalidatePrefix, CACHE_TTL } from '../utils/cache';
import {
    handleImageUploads,
    parseSizes,
    parseCommonFields,
    validateRequiredItemFields,
    generateItemId,
    handleValidationError,
} from '../utils/itemHelpers';

/** Invalidate all sale caches */
const invalidateSaleCache = async (saleId?: string) => {
    await cacheInvalidatePrefix('sales:');
    if (saleId) await cacheDel(`sale:${saleId}`);
};

export const createSale = async (req: Request, res: Response): Promise<void> => {
    try {
        const saleData = req.body;
        const files = (req as any).files as { [fieldname: string]: Express.Multer.File[] };

        // Shared: upload images
        if (!(await handleImageUploads(files, saleData, res))) return;

        // Shared: parse sizes
        if (!parseSizes(saleData, res)) return;

        // Shared: convert types
        parseCommonFields(saleData);

        // Shared: validate
        if (!validateRequiredItemFields(saleData, res)) return;

        if (!saleData.saleId) {
            saleData.saleId = generateItemId('SALE');
        }

        const newSale = await Sale.create(saleData);

        // Shared: invalidate cache (uses SCAN, not KEYS)
        await invalidateSaleCache();

        res.status(201).json(newSale);
    } catch (error: any) {
        if (!handleValidationError(error, res)) {
            console.error('Create sale error:', error);
            res.status(500).json({ error: error.message || 'Failed to create sale item' });
        }
    }
};

export const getAllSales = async (_req: Request, res: Response): Promise<void> => {
    try {
        const cacheKey = 'sales:all';
        const cached = await cacheGet(cacheKey);
        if (cached) { res.json(cached); return; }

        const sales = await Sale.find({}).sort({ createdAt: -1 }).lean();
        await cacheSet(cacheKey, sales, CACHE_TTL.SALES);
        res.json(sales);
    } catch (error) {
        console.error('Get all sales error:', error);
        res.status(500).json({ error: 'Failed to fetch sales' });
    }
};

export const getActiveSales = async (_req: Request, res: Response): Promise<void> => {
    try {
        const activeSaleMode = await SaleMode.findOne({ isActive: true }).lean();
        if (!activeSaleMode) { res.json([]); return; }

        const cacheKey = 'sales:active';
        const cached = await cacheGet(cacheKey);
        if (cached) { res.json(cached); return; }

        const sales = await Sale.find({ saleMode: activeSaleMode.saleName }).sort({ createdAt: -1 }).lean();
        await cacheSet(cacheKey, sales, CACHE_TTL.SALES);
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

        const cached = await cacheGet(cacheKey);
        if (cached) { res.json(cached); return; }

        let sale = await Sale.findOne({ saleId: id }).lean();
        if (!sale) sale = await Sale.findById(id).lean();
        if (!sale) { res.status(404).json({ error: 'Sale item not found' }); return; }

        await cacheSet(cacheKey, sale, CACHE_TTL.SALES);
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

        // Shared: upload images
        if (!(await handleImageUploads(files, updates, res))) return;

        // Shared: parse fields
        parseCommonFields(updates);
        if (updates.sizes && typeof updates.sizes === 'string') {
            try { updates.sizes = JSON.parse(updates.sizes); } catch { updates.sizes = updates.sizes.split(',').map((s: string) => s.trim()); }
        }

        let updated = await Sale.findOneAndUpdate({ saleId: id }, updates, { new: true });
        if (!updated) updated = await Sale.findByIdAndUpdate(id, updates, { new: true });
        if (!updated) { res.status(404).json({ error: 'Sale item not found' }); return; }

        await invalidateSaleCache(id);
        res.json(updated);
    } catch (error: any) {
        console.error('Update sale error:', error);
        res.status(500).json({ error: error.message || 'Failed to update sale item' });
    }
};

export const deleteSale = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        let deleted = await Sale.findOneAndDelete({ saleId: id });
        if (!deleted) deleted = await Sale.findByIdAndDelete(id);
        if (!deleted) { res.status(404).json({ error: 'Sale item not found' }); return; }

        await invalidateSaleCache(id);
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
        await cacheDel('sales:active');

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
        await cacheDel('sales:active');

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
        await cacheDel('sales:active');

        res.json({ message: 'Sale mode deleted successfully' });
    } catch (error: any) {
        console.error('Delete sale mode error:', error);
        res.status(500).json({ error: error.message || 'Failed to delete sale mode' });
    }
};
