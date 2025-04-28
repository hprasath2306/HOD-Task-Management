import { Request, Response } from 'express';
import { PrismaClient, Role, TaskStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Get all tasks (filtered by role)
export const getAllTasks = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const userRole = req.userRole;

    if (!userId || !userRole) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    let filter: any = {};

    // Filter tasks based on role
    if (userRole === Role.ADMIN) {
      // Admin can see all tasks
    } else if (userRole === Role.HOD) {
      // HOD can see tasks they created or all assigned tasks
      filter = {
        OR: [
          { createdById: userId },
          {} // Show all tasks for HOD to monitor
        ]
      };
    } else {
      // Teachers can only see tasks assigned to them
      filter = {
        assignedToId: userId
      };
    }

    const tasks = await prisma.task.findMany({
      where: filter,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        statusUpdates: {
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.status(200).json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Get a specific task
export const getTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const userRole = req.userRole;
    const taskId = parseInt(id);

    if (!userId || !userRole) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (isNaN(taskId)) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }

    // Build access filter based on role
    let accessFilter: any = { id: taskId };
    if (userRole === Role.TEACHER) {
      // Teachers can only access their own tasks
      accessFilter.assignedToId = userId;
    }

    const task = await prisma.task.findFirst({
      where: accessFilter,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        statusUpdates: {
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true
              }
            }
          }
        }
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found or access denied' });
    }

    return res.status(200).json(task);
  } catch (error) {
    console.error('Get task error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Create a new task (HOD only)
export const createTask = async (req: Request, res: Response) => {
  try {
    const { title, description, dueDate, assignedToId } = req.body;
    const createdById = req.userId;

    if (!createdById) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Validate input
    if (!title || !assignedToId) {
      return res.status(400).json({ error: 'Title and assignedToId are required' });
    }

    // Parse assignedToId to number
    const assigneeId = parseInt(assignedToId);
    
    if (isNaN(assigneeId)) {
      return res.status(400).json({ error: 'Invalid assignedToId' });
    }

    // Check if assigned teacher exists
    const assignedTeacher = await prisma.user.findFirst({
      where: {
        id: assigneeId,
        role: {
          in: [Role.TEACHER, Role.HOD]
        }
      }
    });

    if (!assignedTeacher) {
      return res.status(404).json({ error: 'Assigned teacher not found' });
    }

    // Parse dueDate if provided
    let parsedDueDate: Date | undefined = undefined;
    if (dueDate) {
      parsedDueDate = new Date(dueDate);
      if (isNaN(parsedDueDate.getTime())) {
        return res.status(400).json({ error: 'Invalid due date format' });
      }
    }

    // Create task
    const newTask = await prisma.task.create({
      data: {
        title,
        description,
        dueDate: parsedDueDate,
        createdById,
        assignedToId: assigneeId,
        status: TaskStatus.PENDING,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    // Create initial status update
    await prisma.taskStatusUpdate.create({
      data: {
        taskId: newTask.id,
        userId: createdById,
        status: TaskStatus.PENDING,
        comment: 'Task created'
      }
    });

    return res.status(201).json(newTask);
  } catch (error) {
    console.error('Create task error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Update a task status (both HOD and Teachers)
export const updateTaskStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, comment } = req.body;
    const userId = req.userId;
    const userRole = req.userRole;
    const taskId = parseInt(id);

    if (!userId || !userRole) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (isNaN(taskId)) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }

    // Validate status
    if (!status || !Object.values(TaskStatus).includes(status as TaskStatus)) {
      return res.status(400).json({ error: 'Valid status is required' });
    }

    // Find task and check access rights
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check access based on role
    if (userRole === Role.TEACHER && task.assignedToId !== userId) {
      return res.status(403).json({ error: 'You can only update tasks assigned to you' });
    }

    // Update task status
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { status: status as TaskStatus },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    // Create status update record
    await prisma.taskStatusUpdate.create({
      data: {
        taskId,
        userId,
        status: status as TaskStatus,
        comment
      }
    });

    return res.status(200).json(updatedTask);
  } catch (error) {
    console.error('Update task status error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Update task details (HOD only)
export const updateTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, dueDate, assignedToId } = req.body;
    const userId = req.userId;
    const taskId = parseInt(id);

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (isNaN(taskId)) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }

    // Find task
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if HOD is the creator
    if (task.createdById !== userId) {
      return res.status(403).json({ error: 'You can only update tasks you created' });
    }

    // Prepare update data
    const updateData: any = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    
    // Handle due date
    if (dueDate) {
      const parsedDueDate = new Date(dueDate);
      if (isNaN(parsedDueDate.getTime())) {
        return res.status(400).json({ error: 'Invalid due date format' });
      }
      updateData.dueDate = parsedDueDate;
    } else if (dueDate === null) {
      updateData.dueDate = null;
    }

    // Handle assignee change
    if (assignedToId) {
      const assigneeId = parseInt(assignedToId);
      if (isNaN(assigneeId)) {
        return res.status(400).json({ error: 'Invalid assignedToId' });
      }

      // Check if new assignee exists
      const assignedTeacher = await prisma.user.findFirst({
        where: {
          id: assigneeId,
          role: {
            in: [Role.TEACHER, Role.HOD]
          }
        }
      });

      if (!assignedTeacher) {
        return res.status(404).json({ error: 'Assigned teacher not found' });
      }

      updateData.assignedToId = assigneeId;
    }

    // Update task
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    // Create comment about update if assignee changed
    if (assignedToId && assignedToId !== task.assignedToId) {
      await prisma.taskStatusUpdate.create({
        data: {
          taskId,
          userId,
          status: task.status,
          comment: `Task reassigned to ${updatedTask.assignedTo.name}`
        }
      });
    }

    return res.status(200).json(updatedTask);
  } catch (error) {
    console.error('Update task error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a task (HOD only)
export const deleteTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const taskId = parseInt(id);

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (isNaN(taskId)) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }

    // Find task
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if HOD is the creator
    if (task.createdById !== userId) {
      return res.status(403).json({ error: 'You can only delete tasks you created' });
    }

    // Delete all status updates first
    await prisma.taskStatusUpdate.deleteMany({
      where: { taskId }
    });

    // Delete task
    await prisma.task.delete({
      where: { id: taskId }
    });

    return res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}; 