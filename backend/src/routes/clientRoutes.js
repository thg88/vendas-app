import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient
} from '../controllers/clientController.js';

const router = express.Router();

router.get('/', verifyToken, getAllClients);
router.get('/:id', verifyToken, getClientById);
router.post('/', verifyToken, createClient);
router.put('/:id', verifyToken, updateClient);
router.delete('/:id', verifyToken, deleteClient);

export default router;
