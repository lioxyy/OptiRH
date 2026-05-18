import { prisma } from '../../db/client'
import { createNotification } from '../../lib/notifications'
import * as fs from 'fs'
import * as path from 'path'

// Helper pour envoyer les notifications de recrutement aux RH (Admins et Agents)
async function notifyAdminsAndAgents(type: string, message: string, targetModel: string, targetId: number) {
  try {
    const recipients = await prisma.employee.findMany({
      where: { role: { in: ['Admin', 'Agent'] } },
      select: { id_emp: true }
    })
    for (const r of recipients) {
      await createNotification(
        prisma,
        r.id_emp,
        type as any,
        message,
        targetModel,
        targetId
      )
    }
  } catch (err) {
    console.error('[notifyAdminsAndAgents] Error creating notifications:', err)
  }
}

// ─── JOB OFFERS ───────────────────────────────────────────────

export async function getJobOffers() {
  return prisma.jobOffer.findMany({
    include: { _count: { select: { applications: true } } },
    orderBy: { id_offer: 'desc' }
  })
}

export async function getPublishedOffers() {
  return prisma.jobOffer.findMany({
    where: { status: 'Published' },
    orderBy: { date_publication: 'desc' }
  })
}

export async function createJobOffer(data: any) {
  return prisma.jobOffer.create({ data })
}

export async function updateJobOffer(id: number, data: any) {
  return prisma.jobOffer.update({ where: { id_offer: id }, data })
}

export async function deleteJobOffer(id: number) {
  return prisma.jobOffer.delete({ where: { id_offer: id } })
}

// ─── CANDIDATES ───────────────────────────────────────────────

export async function getCandidates() {
  return prisma.candidat.findMany({
    include: { 
      agent: { select: { name: true } },
      _count: { select: { applications: true } }
    },
    orderBy: { date_inscription: 'desc' }
  })
}

export async function getCandidateById(id: number) {
  return prisma.candidat.findUnique({
    where: { id_cand: id },
    include: {
      applications: { include: { offer: true, entretiens: true } },
      entretiens: { include: { agent: { select: { name: true } } } }
    }
  })
}

export async function createCandidate(data: any) {
  return prisma.candidat.create({ data })
}

export async function updateCandidate(id: number, data: any) {
  return prisma.candidat.update({ where: { id_cand: id }, data })
}

export async function deleteCandidate(id: number) {
  const candidat = await prisma.candidat.findUnique({ where: { id_cand: id } })
  if (candidat?.cv_path && fs.existsSync(candidat.cv_path)) {
    fs.unlinkSync(candidat.cv_path)
  }
  if (candidat?.lettre_path && fs.existsSync(candidat.lettre_path)) {
    fs.unlinkSync(candidat.lettre_path)
  }
  return prisma.candidat.delete({ where: { id_cand: id } })
}

// ─── APPLICATIONS ─────────────────────────────────────────────

export async function getApplications() {
  return prisma.application.findMany({
    include: {
      candidat: true,
      offer: true,
      entretiens: { include: { agent: { select: { name: true } } } }
    },
    orderBy: { date_postulation: 'desc' }
  })
}

export async function getApplicationsByOffer(offerId: number) {
  return prisma.application.findMany({
    where: { id_offer: offerId },
    include: { candidat: true, entretiens: true },
    orderBy: { date_postulation: 'desc' }
  })
}

export async function createApplication(data: any) {
  // Vérifier si le candidat a déjà postulé à cette offre
  const existing = await prisma.application.findFirst({
    where: { id_cand: data.id_cand, id_offer: data.id_offer }
  })
  if (existing) throw new Error('Ce candidat a déjà postulé à cette offre.')
  
  const app = await prisma.application.create({ data, include: { candidat: true, offer: true } })

  // Notification: candidature reçue
  await notifyAdminsAndAgents(
    'APPLICATION_RECEIVED',
    `Nouvelle candidature reçue de ${app.candidat.prenom} ${app.candidat.nom} pour le poste de "${app.offer.title}".`,
    'Application',
    app.id_application
  )

  return app
}

export async function updateApplicationStatus(id: number, status: string, notes?: string) {
  const app = await prisma.application.update({
    where: { id_application: id },
    data: { status, ...(notes !== undefined && { notes }) },
    include: { candidat: true, offer: true }
  })

  // Notification: candidature acceptée / rejetée
  if (status === 'Acceptée') {
    await notifyAdminsAndAgents(
      'APPLICATION_ACCEPTED',
      `Candidature de ${app.candidat.prenom} ${app.candidat.nom} pour "${app.offer.title}" ACCEPTÉE.`,
      'Application',
      app.id_application
    )
  } else if (status === 'Rejetée') {
    await notifyAdminsAndAgents(
      'APPLICATION_REJECTED',
      `Candidature de ${app.candidat.prenom} ${app.candidat.nom} pour "${app.offer.title}" rejetée.`,
      'Application',
      app.id_application
    )
  }

  return app
}

export async function deleteApplication(id: number) {
  return prisma.application.delete({ where: { id_application: id } })
}

export async function promoteToEmployee(applicationId: number, employeeData: any) {
  const application = await prisma.application.findUnique({
    where: { id_application: applicationId },
    include: { candidat: true, offer: true }
  })
  if (!application) throw new Error('Candidature introuvable.')

  return prisma.$transaction(async (tx: any) => {
    // Créer l'employé
    const employee = await tx.employee.create({
      data: {
        name: `${application.candidat.prenom} ${application.candidat.nom}`,
        email: application.candidat.email,
        password_hash: '$2b$10$defaultHashForNewEmployee',
        phone: application.candidat.telephone,
        date_birth: application.candidat.date_birth || new Date(),
        date_employment: new Date(),
        role: employeeData.role || 'Employee',
        id_dept: employeeData.id_dept,
      }
    })

    // Extraire le salaire numérique de l'offre (ex: "45 000 - 55 000 DZD" -> 45000)
    let baseSalary = 40000
    if (application.offer.salary) {
      const cleaned = application.offer.salary.replace(/\s/g, '')
      const match = cleaned.match(/\d+/)
      if (match) {
        baseSalary = parseFloat(match[0])
      }
    }

    // Créer automatiquement le contrat de travail associé
    await tx.contract.create({
      data: {
        type: application.offer.contract_type || 'CDI',
        status: 'Active',
        date_deb: new Date(),
        salaire_base: baseSalary,
        id_emp: employee.id_emp
      }
    })

    // Mettre à jour la candidature
    await tx.application.update({
      where: { id_application: applicationId },
      data: { status: 'Acceptée' }
    })

    return employee
  })
}

// ─── INTERVIEWS ───────────────────────────────────────────────

export async function getInterviews() {
  return prisma.entretien.findMany({
    include: {
      candidat: true,
      application: { include: { offer: true } },
      agent: { select: { name: true } }
    },
    orderBy: { date_heure: 'asc' }
  })
}

export async function createInterview(data: any) {
  const interview = await prisma.entretien.create({
    data,
    include: {
      candidat: true,
      agent: { select: { name: true } },
      application: { include: { offer: true } }
    }
  })

  // Notification: entretien programmé
  try {
    const dtStr = new Date(interview.date_heure).toLocaleString('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'short'
    })
    const postName = interview.application?.offer?.title || 'le poste'
    await notifyAdminsAndAgents(
      'INTERVIEW_SCHEDULED',
      `Entretien programmé pour ${interview.candidat.prenom} ${interview.candidat.nom} (${postName}) le ${dtStr}.`,
      'Entretien',
      interview.id_entretien
    )
  } catch (err) {
    console.error('Failed to send interview notification:', err)
  }

  return interview
}

export async function updateInterview(id: number, data: any) {
  const updated = await prisma.entretien.update({
    where: { id_entretien: id },
    data
  })
  // Si l'entretien est terminé avec résultat, mettre à jour la candidature
  if (data.result && data.id_application) {
    let newStatus = 'EnCours'
    if (data.result === 'Validé') newStatus = 'Acceptée'
    else if (data.result === 'Rejeté') newStatus = 'Rejetée'
    else if (data.result === 'SecondEntretien') newStatus = 'Entretien'
    await updateApplicationStatus(data.id_application, newStatus)
  }
  return updated
}

export async function deleteInterview(id: number) {
  return prisma.entretien.delete({ where: { id_entretien: id } })
}

// ─── DASHBOARD ────────────────────────────────────────────────

export async function getRecruitmentStats() {
  const [totalOffers, publishedOffers, totalApplications, totalCandidates, upcomingInterviews, recentApplications] = await Promise.all([
    prisma.jobOffer.count(),
    prisma.jobOffer.count({ where: { status: 'Published' } }),
    prisma.application.count(),
    prisma.candidat.count(),
    prisma.entretien.count({ where: { status: 'Planifié', date_heure: { gte: new Date() } } }),
    prisma.application.groupBy({
      by: ['id_offer'],
      _count: { id_application: true },
    })
  ])

  const offersWithCount = await prisma.jobOffer.findMany({
    include: { _count: { select: { applications: true } } },
    orderBy: { id_offer: 'desc' },
    take: 5
  })

  const applicationsByStatus = await prisma.application.groupBy({
    by: ['status'],
    _count: { id_application: true }
  })

  return {
    totalOffers,
    publishedOffers,
    totalApplications,
    totalCandidates,
    upcomingInterviews,
    offersWithCount,
    applicationsByStatus
  }
}
