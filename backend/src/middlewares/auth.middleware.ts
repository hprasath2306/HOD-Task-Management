import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TokenPayload {
  id: number;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      userId?: number;
      userRole?: string;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback-secret'
    ) as TokenPayload;

    req.userId = decoded.id;
    req.userRole = decoded.role;

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized - Invalid token' });
  }
};

export const authorizeAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.userRole !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden - Admin access required' });
  }
  next();
};

export const authorizeHOD = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.userRole !== 'HOD') {
    return res.status(403).json({ error: 'Forbidden - HOD access required' });
  }
  next();
};

export const authorizeTeacher = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.userRole !== 'TEACHER' && req.userRole !== 'HOD') {
    return res.status(403).json({ error: 'Forbidden - Teacher access required' });
  }
  next();
};

export const authorizeHODOrAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.userRole !== 'HOD' && req.userRole !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden - HOD or Admin access required' });
  }
  next();
}; 