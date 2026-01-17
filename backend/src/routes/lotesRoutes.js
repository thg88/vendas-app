import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import {
  getAllLotes,
  getLoteById,
  getLoteAberto,
  createLote,
  closeLote,
  reopenLote,
  deleteLote,
  deleteEmptyLote,
  getLoteStats
} from '../controllers/lotesController.js';

const router = express.Router();

router.get('/', verifyToken, getAllLotes);
router.get('/aberto/atual', verifyToken, getLoteAberto);
router.get('/:id/stats', verifyToken, getLoteStats);
router.get('/:id', verifyToken, getLoteById);
router.post('/', verifyToken, createLote);
router.put('/:id/fechar', verifyToken, closeLote);
router.put('/:id/reabrir', verifyToken, reopenLote);
router.delete('/:id/vazio', verifyToken, deleteEmptyLote);
router.delete('/:id', verifyToken, deleteLote);

export default router;
