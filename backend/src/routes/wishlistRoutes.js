import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import {
  getAllWishes,
  getWishById,
  createWish,
  updateWish,
  deleteWish
} from '../controllers/wishlistController.js';

const router = express.Router();

router.get('/', verifyToken, getAllWishes);
router.get('/:id', verifyToken, getWishById);
router.post('/', verifyToken, createWish);
router.put('/:id', verifyToken, updateWish);
router.delete('/:id', verifyToken, deleteWish);

export default router;
