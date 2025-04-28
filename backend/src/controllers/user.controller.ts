import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

// Get all teachers (including HOD by default)
export const getAllTeachers = async (req: Request, res: Response) => {
  try {
    const excludeHOD = req.query.excludeHOD === 'true';
    
    const teachers = await prisma.user.findMany({
      where: {
        role: {
          in: excludeHOD ? [Role.TEACHER] : [Role.TEACHER, Role.HOD]
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json(teachers);
  } catch (error) {
    console.error('Get teachers error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Get a specific teacher
export const getTeacher = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const teacherId = parseInt(id);

    if (isNaN(teacherId)) {
      return res.status(400).json({ error: 'Invalid teacher ID' });
    }

    const teacher = await prisma.user.findUnique({
      where: {
        id: teacherId,
        role: {
          in: [Role.TEACHER, Role.HOD]
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    return res.status(200).json(teacher);
  } catch (error) {
    console.error('Get teacher error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Create a new teacher
export const createTeacher = async (req: Request, res: Response) => {
  try {
    const { name, email, password, isHOD } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    // If setting as HOD, check if there's already an HOD
    if (isHOD) {
      const existingHOD = await prisma.user.findFirst({
        where: { role: Role.HOD },
      });

      if (existingHOD) {
        return res.status(400).json({ 
          error: 'There is already an HOD assigned. Please remove the current HOD first.',
          currentHOD: {
            id: existingHOD.id,
            name: existingHOD.name,
            email: existingHOD.email
          }
        });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create teacher
    const newTeacher = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: isHOD ? Role.HOD : Role.TEACHER,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(201).json(newTeacher);
  } catch (error) {
    console.error('Create teacher error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Update a teacher
export const updateTeacher = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, isHOD } = req.body;
    const teacherId = parseInt(id);

    if (isNaN(teacherId)) {
      return res.status(400).json({ error: 'Invalid teacher ID' });
    }

    // Check if teacher exists
    const teacher = await prisma.user.findUnique({
      where: {
        id: teacherId,
        role: {
          in: [Role.TEACHER, Role.HOD]
        },
      },
    });

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // If changing to HOD, check if there's already another HOD
    if (isHOD && teacher.role !== Role.HOD) {
      const existingHOD = await prisma.user.findFirst({
        where: { 
          role: Role.HOD,
          id: { not: teacherId }
        },
      });

      if (existingHOD) {
        return res.status(400).json({ 
          error: 'There is already an HOD assigned. Please remove the current HOD first.',
          currentHOD: {
            id: existingHOD.id,
            name: existingHOD.name,
            email: existingHOD.email
          }
        });
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) {
      // Check if email is already used by another user
      if (email !== teacher.email) {
        const existingEmail = await prisma.user.findUnique({ 
          where: { 
            email,
            //@ts-ignore
            id: { not: teacherId }
          } 
        });
        if (existingEmail) {
          return res.status(400).json({ error: 'Email already in use' });
        }
        updateData.email = email;
      }
    }
    
    // Update role if necessary
    if (isHOD !== undefined) {
      updateData.role = isHOD ? Role.HOD : Role.TEACHER;
    }

    // Update teacher
    const updatedTeacher = await prisma.user.update({
      where: { id: teacherId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json(updatedTeacher);
  } catch (error) {
    console.error('Update teacher error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a teacher
export const deleteTeacher = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const teacherId = parseInt(id);

    if (isNaN(teacherId)) {
      return res.status(400).json({ error: 'Invalid teacher ID' });
    }

    // Check if teacher exists
    const teacher = await prisma.user.findUnique({
      where: {
        id: teacherId,
        role: {
          in: [Role.TEACHER, Role.HOD]
        },
      },
    });

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Check if there are any assigned tasks for this teacher
    const taskCount = await prisma.task.count({
      where: { assignedToId: teacherId },
    });

    if (taskCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete teacher with assigned tasks. Please reassign or delete the tasks first.',
        taskCount
      });
    }

    // Delete teacher
    await prisma.user.delete({
      where: { id: teacherId },
    });

    return res.status(200).json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    console.error('Delete teacher error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}; 