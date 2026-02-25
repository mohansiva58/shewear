import express, { Router } from 'express';
import { upload } from '../middleware/upload';
import {
    createSale,
    getAllSales,
    getActiveSales,
    getSaleById,
    updateSale,
    deleteSale,
    createOrUpdateSaleMode,
    getAllSaleModes,
    getActiveSaleMode,
    toggleSaleMode,
    deleteSaleMode
} from '../controllers/saleController';

const router: Router = express.Router();

// Sale Items Routes
router.get('/items', getAllSales);
router.get('/items/active', getActiveSales);
router.get('/items/:id', getSaleById);
router.post('/items', upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'images', maxCount: 8 }
]), createSale);
router.put('/items/:id', upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'images', maxCount: 8 }
]), updateSale);
router.delete('/items/:id', deleteSale);

// Sale Mode Routes
router.get('/modes', getAllSaleModes);
router.get('/modes/active', getActiveSaleMode);
router.post('/modes', createOrUpdateSaleMode);
router.put('/modes/:saleName/toggle', toggleSaleMode);
router.delete('/modes/:saleName', deleteSaleMode);

export default router;
