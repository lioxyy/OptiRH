import { prisma } from '../../db/client'
import { AppError } from '../../lib/errors'
import type { RequestUser } from '../../middleware/authenticate'
import type { CreateTaskDTO, UpdateTaskDTO } from './tasks.types'

export async function getTasks(user: RequestUser) {
  if (user.role === 'Admin') {
    return prisma.task.findMany({
      include: {
        creator: { select: { name: true } },
        assignee: { select: { name: true } },
      },
      orderBy: { date_deb: 'desc' },
    })
  }

  if (user.role === 'Agent') {
    return prisma.task.findMany({
      where: {
        OR: [
          { assigned_by: user.id_emp },
          { assignee: { id_dept: user.id_dept } },
        ],
      },
      include: {
        creator: { select: { name: true } },
        assignee: { select: { name: true } },
      },
      orderBy: { date_deb: 'desc' },
    })
  }

  return prisma.task.findMany({
    where: { assigned_to: user.id_emp },
    include: { creator: { select: { name: true } }, assignee: { select: { name: true } } },
    orderBy: { date_deb: 'desc' },
  })
}

export async function createTask(data: CreateTaskDTO, actorId: number) {
  return prisma.task.create({
    data: {
      name: data.name,
      description: data.description ?? null,
      priority: data.priority,
      date_deb: new Date(data.date_deb),
      date_fin: new Date(data.date_fin),
      assigned_by: actorId,
      assigned_to: data.assigned_to,
      status: 'To Do',
    },
    include: {
      creator: { select: { name: true } },
      assignee: { select: { name: true } },
    },
  })
}

export async function updateTask(id: number, data: UpdateTaskDTO, user: RequestUser) {
  const task = await prisma.task.findUnique({ where: { id_task: id } })
  if (!task) throw new AppError('TASK_NOT_FOUND', 404)

  if (user.role === 'Employee' && task.assigned_to !== user.id_emp) {
    throw new AppError('FORBIDDEN', 403, 'You can only update tasks assigned to you')
  }

  return prisma.task.update({
    where: { id_task: id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.priority !== undefined && { priority: data.priority }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.date_deb !== undefined && { date_deb: new Date(data.date_deb) }),
      ...(data.date_fin !== undefined && { date_fin: new Date(data.date_fin) }),
      ...(data.assigned_to !== undefined && { assigned_to: data.assigned_to }),
    },
    include: {
      creator: { select: { name: true } },
      assignee: { select: { name: true } },
    },
  })
}

export async function deleteTask(id: number) {
  const task = await prisma.task.findUnique({ where: { id_task: id } })
  if (!task) throw new AppError('TASK_NOT_FOUND', 404)

  return prisma.task.delete({ where: { id_task: id } })
}
