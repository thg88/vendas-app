import express from 'express';
import { registerPayment, getPaymentsByVenda } from '../controllers/paymentController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', authenticateToken, registerPayment);
router.get('/:venda_id', authenticateToken, getPaymentsByVenda);

export default router;
