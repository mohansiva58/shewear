import express from 'express';
import {
    getAllProducts,
    getProductById,
    getFeaturedProducts,
    createProduct,
    bulkCreateProducts,
    updateProduct,
    deleteProduct
} from '../controllers/productController';
import { upload } from '../middleware/upload';

const router = express.Router();

router.get('/featured', getFeaturedProducts);
router.get('/', getAllProducts);
router.get('/:id', getProductById);

// Admin routes
router.post('/', upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'images', maxCount: 8 }
]), createProduct);

router.post('/bulk', bulkCreateProducts);

router.put('/:id', upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'images', maxCount: 8 }
]), updateProduct);

router.delete('/:id', deleteProduct);

export default router;
