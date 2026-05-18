import { prisma } from '../../db/client'
import { AppError } from '../../lib/errors'
import { writeAuditLog } from '../../lib/audit'
import type { CreateFormationDTO, UpdateFormationDTO } from './formation.types'

function toDate(value: string | Date | undefined) {
    if (!value) return undefined
    return value instanceof Date ? value : new Date(value)
}

export async function getFormations() {
    return prisma.formation.findMany({
        include: { instructor: { select: { id_emp: true, name: true } } }
    })
}

export async function getFormationById(id: number) {
    const f = await prisma.formation.findUnique({
        where: { id_formation: id },
        include: { instructor: { select: { id_emp: true, name: true } } }
    })
    if (!f) throw new AppError('NOT_FOUND', 404)
    return f
}

export async function createFormation(data: CreateFormationDTO, actorId: number) {
    const parsedDate = toDate(data.date_deb)
    if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
        throw new AppError('VALIDATION_ERROR', 400, { date_deb: 'Invalid date' })
    }

    return prisma.$transaction(async (tx) => {
        const created = await tx.formation.create({
            data: {
                name: data.name,
                description: data.description,
                location: data.location,
                date_deb: parsedDate,
                duration_days: data.duration_days,
                id_instructor: data.id_instructor,
                external_instructor: data.external_instructor,
            },
        })
        await writeAuditLog(tx, actorId, 'CREATE', 'Formation', created.id_formation, created)
        return created
    })
}

export async function updateFormation(id: number, data: UpdateFormationDTO, actorId: number) {
    const existing = await prisma.formation.findUnique({ where: { id_formation: id } })
    if (!existing) throw new AppError('NOT_FOUND', 404)
    return prisma.$transaction(async (tx) => {
        const updated = await tx.formation.update({
            where: { id_formation: id },
            data: {
                ...(data.name !== undefined ? { name: data.name } : {}),
                ...(data.description !== undefined ? { description: data.description } : {}),
                ...(data.location !== undefined ? { location: data.location } : {}),
                ...(data.date_deb !== undefined ? { date_deb: toDate(data.date_deb)! } : {}),
                ...(data.duration_days !== undefined ? { duration_days: data.duration_days } : {}),
                ...(data.id_instructor !== undefined ? { id_instructor: data.id_instructor } : {}),
                ...(data.external_instructor !== undefined ? { external_instructor: data.external_instructor } : {}),
            },
        })
        await writeAuditLog(tx, actorId, 'UPDATE', 'Formation', id, updated)
        return updated
    })
}

export async function deleteFormation(id: number, actorId: number) {
    const existing = await prisma.formation.findUnique({ where: { id_formation: id } })
    if (!existing) throw new AppError('NOT_FOUND', 404)
    return prisma.$transaction(async (tx) => {
        await tx.formation.delete({ where: { id_formation: id } })
        await writeAuditLog(tx, actorId, 'DELETE', 'Formation', id, existing)
    })
}

export async function assignInstructor(id: number, id_instructor: number, actorId: number) {
    const existing = await prisma.formation.findUnique({ where: { id_formation: id } })
    if (!existing) throw new AppError('NOT_FOUND', 404)
    const instructor = await prisma.employee.findUnique({ where: { id_emp: id_instructor } })
    if (!instructor) throw new AppError('EMPLOYEE_NOT_FOUND', 404)
    return prisma.$transaction(async (tx) => {
        const updated = await tx.formation.update({
            where: { id_formation: id },
            data: { id_instructor, external_instructor: null },
        })
        await writeAuditLog(tx, actorId, 'UPDATE', 'Formation', id, { id_instructor })
        return updated
    })
}

export async function getParticipants(formationId: number) {
    const f = await prisma.formation.findUnique({
        where: { id_formation: formationId },
        include: {
            participations: {
                include: { employee: { select: { id_emp: true, name: true, email: true, role: true } } },
            },
        },
    })
    if (!f) throw new AppError('NOT_FOUND', 404)
    return f.participations.map((p) => p.employee)
}

export async function addParticipant(formationId: number, empId: number, actorId: number) {
    const f = await prisma.formation.findUnique({ where: { id_formation: formationId } })
    if (!f) throw new AppError('NOT_FOUND', 404)
    const emp = await prisma.employee.findUnique({ where: { id_emp: empId } })
    if (!emp) throw new AppError('EMPLOYEE_NOT_FOUND', 404)
    return prisma.$transaction(async (tx) => {
        const participation = await tx.participationFormation.upsert({
            where: { id_emp_id_formation: { id_emp: empId, id_formation: formationId } },
            create: { id_emp: empId, id_formation: formationId },
            update: {},
        })
        await writeAuditLog(tx, actorId, 'CREATE', 'ParticipationFormation', formationId, { empId })
        return participation
    })
}

export async function removeParticipant(formationId: number, empId: number, actorId: number) {
    const f = await prisma.formation.findUnique({ where: { id_formation: formationId } })
    if (!f) throw new AppError('NOT_FOUND', 404)
    return prisma.$transaction(async (tx) => {
        await tx.participationFormation.delete({
            where: { id_emp_id_formation: { id_emp: empId, id_formation: formationId } },
        })
        await writeAuditLog(tx, actorId, 'DELETE', 'ParticipationFormation', formationId, { empId })
    })
}

export async function scheduleFormation(id: number, date_deb?: string, duration_days?: number, actorId?: number) {
    const existing = await prisma.formation.findUnique({ where: { id_formation: id } })
    if (!existing) throw new AppError('NOT_FOUND', 404)
    const data: { date_deb?: Date; duration_days?: number } = {}
    if (date_deb !== undefined) data.date_deb = toDate(date_deb)
    if (duration_days !== undefined) data.duration_days = duration_days
    return prisma.$transaction(async (tx) => {
        const updated = await tx.formation.update({ where: { id_formation: id }, data })
        if (actorId) await writeAuditLog(tx, actorId, 'UPDATE', 'Formation', id, data)
        return updated
    })
}
