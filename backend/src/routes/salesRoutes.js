import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import {
  getAllSales,
  getSaleById,
  createSale,
  getSalesByDateRange,
  deleteItemFromSale,
  updateItemQuantity,
  updatePaymentMethod
} from '../controllers/salesController.js';

const router = express.Router();

router.get('/', verifyToken, getAllSales);
router.get('/date-range', verifyToken, getSalesByDateRange);
router.get('/:id', verifyToken, getSaleById);
router.post('/', verifyToken, createSale);
router.delete('/item/:itemId', verifyToken, deleteItemFromSale);
router.put('/item/:itemId', verifyToken, updateItemQuantity);
router.put('/:vendaId/payment-method', verifyToken, updatePaymentMethod);

export default router;
