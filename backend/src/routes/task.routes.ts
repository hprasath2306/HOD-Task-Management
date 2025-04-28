import express from 'express';
import {
  getAllTasks,
  getTask,
  createTask,
  updateTaskStatus,
  updateTask,
  deleteTask
} from '../controllers/task.controller';
import { authenticate, authorizeHOD } from '../middlewares/auth.middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Routes accessible to all authenticated users (teachers and HOD)
router.get('/', getAllTasks);
router.get('/:id', getTask);
router.put('/:id/status', updateTaskStatus);

// HOD-only routes
router.post('/', authorizeHOD, createTask);
router.put('/:id', authorizeHOD, updateTask);
router.delete('/:id', authorizeHOD, deleteTask);

export default router; 