import express from 'express';
import {
  getAllTeachers,
  getTeacher,
  createTeacher,
  updateTeacher,
  deleteTeacher
} from '../controllers/user.controller';
import { authenticate, authorizeAdmin, authorizeHOD } from '../middlewares/auth.middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Admin-only routes for teacher management
router.get('/teachers', authorizeHOD, getAllTeachers);
router.get('/teachers/:id', authorizeAdmin, getTeacher);
router.post('/teachers', authorizeAdmin, createTeacher);
router.put('/teachers/:id', authorizeAdmin, updateTeacher);
router.delete('/teachers/:id', authorizeAdmin, deleteTeacher);

export default router; 