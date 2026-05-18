import { Router } from 'express'
import multer from 'multer'
import * as path from 'path'
import * as fs from 'fs'
import { asyncHandler } from '../../lib/async-handler'
import { authenticate } from '../../middleware/authenticate'
import { authorize } from '../../middleware/authorize'
import { success } from '../../lib/response'
import { prisma } from '../../db/client'
import * as RecruitmentService from './recruitment.service'

const router = Router()

// ─── UPLOAD CONFIG ─────────────────────────────────────────────
const uploadsDir = path.join(process.cwd(), 'uploads', 'recruitment')
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`
    cb(null, uniqueName)
  }
})
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx']
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowed.includes(ext)) cb(null, true)
    else cb(new Error('Seuls les fichiers PDF, DOC et DOCX sont acceptés.'))
  }
})

// ─── PUBLIC ROUTE (No Auth) ───────────────────────────────────
router.get('/offers/public', asyncHandler(async (_req, res) => {
  const offers = await RecruitmentService.getPublishedOffers()
  res.json(success(offers))
}))

router.post('/apply', upload.fields([
  { name: 'cv', maxCount: 1 },
  { name: 'lettre', maxCount: 1 }
]), asyncHandler(async (req, res) => {
  const files = req.files as { [k: string]: Express.Multer.File[] }
  const candidateData = {
    nom: req.body.nom,
    prenom: req.body.prenom,
    email: req.body.email,
    telephone: req.body.telephone,
    cv_path: files?.cv?.[0]?.path || null,
    lettre_path: files?.lettre?.[0]?.path || null,
  }
  // Create candidate if not exists
  const existing = await prisma.candidat.findUnique({ where: { email: candidateData.email } })
  let candidat
  if (existing) {
    candidat = await prisma.candidat.update({ where: { id_cand: existing.id_cand }, data: candidateData })
  } else {
    candidat = await prisma.candidat.create({ data: candidateData })
  }


  const application = await RecruitmentService.createApplication({
    id_cand: candidat.id_cand,
    id_offer: Number(req.body.id_offer),
  })
  res.status(201).json(success(application, 'Candidature soumise avec succès!'))
}))

// ─── AUTHENTICATED ROUTES ─────────────────────────────────────
router.use(authenticate)

// Job Offers
router.get('/offers', asyncHandler(async (_req, res) => {
  res.json(success(await RecruitmentService.getJobOffers()))
}))

router.post('/offers', authorize('Admin', 'Agent'), asyncHandler(async (req, res) => {
  const offer = await RecruitmentService.createJobOffer({ ...req.body, created_by: req.user.id_emp })
  res.status(201).json(success(offer))
}))

router.patch('/offers/:id', authorize('Admin', 'Agent'), asyncHandler(async (req, res) => {
  const offer = await RecruitmentService.updateJobOffer(Number(req.params.id), req.body)
  res.json(success(offer))
}))

router.delete('/offers/:id', authorize('Admin'), asyncHandler(async (req, res) => {
  await RecruitmentService.deleteJobOffer(Number(req.params.id))
  res.json(success(null, 'Offre supprimée'))
}))

// Candidates
router.get('/candidates', authorize('Admin', 'Agent'), asyncHandler(async (_req, res) => {
  res.json(success(await RecruitmentService.getCandidates()))
}))

router.get('/candidates/:id', authorize('Admin', 'Agent'), asyncHandler(async (req, res) => {
  const c = await RecruitmentService.getCandidateById(Number(req.params.id))
  res.json(success(c))
}))

router.post('/candidates', authorize('Admin', 'Agent'),
  upload.fields([{ name: 'cv', maxCount: 1 }, { name: 'lettre', maxCount: 1 }]),
  asyncHandler(async (req, res) => {
    const files = req.files as { [k: string]: Express.Multer.File[] }
    const data = {
      ...req.body,
      cv_path: files?.cv?.[0]?.path || undefined,
      lettre_path: files?.lettre?.[0]?.path || undefined,
    }
    const c = await RecruitmentService.createCandidate(data)
    res.status(201).json(success(c))
  })
)

router.patch('/candidates/:id', authorize('Admin', 'Agent'),
  upload.fields([{ name: 'cv', maxCount: 1 }, { name: 'lettre', maxCount: 1 }]),
  asyncHandler(async (req, res) => {
    const files = req.files as { [k: string]: Express.Multer.File[] }
    const data = {
      ...req.body,
      ...(files?.cv?.[0]?.path && { cv_path: files.cv[0].path }),
      ...(files?.lettre?.[0]?.path && { lettre_path: files.lettre[0].path }),
    }
    const c = await RecruitmentService.updateCandidate(Number(req.params.id), data)
    res.json(success(c))
  })
)

router.delete('/candidates/:id', authorize('Admin'), asyncHandler(async (req, res) => {
  await RecruitmentService.deleteCandidate(Number(req.params.id))
  res.json(success(null, 'Candidat supprimé'))
}))

// Applications
router.get('/applications', authorize('Admin', 'Agent'), asyncHandler(async (_req, res) => {
  res.json(success(await RecruitmentService.getApplications()))
}))

router.post('/applications', authorize('Admin', 'Agent'), asyncHandler(async (req, res) => {
  const app = await RecruitmentService.createApplication(req.body)
  res.status(201).json(success(app))
}))

router.patch('/applications/:id/status', authorize('Admin', 'Agent'), asyncHandler(async (req, res) => {
  const { status, notes } = req.body
  const app = await RecruitmentService.updateApplicationStatus(Number(req.params.id), status, notes)
  res.json(success(app))
}))

router.delete('/applications/:id', authorize('Admin'), asyncHandler(async (req, res) => {
  await RecruitmentService.deleteApplication(Number(req.params.id))
  res.json(success(null, 'Candidature supprimée'))
}))

router.post('/applications/:id/promote', authorize('Admin', 'Agent'), asyncHandler(async (req, res) => {
  const employee = await RecruitmentService.promoteToEmployee(Number(req.params.id), req.body)
  res.status(201).json(success(employee, 'Employé créé avec succès!'))
}))

// Interviews
router.get('/interviews', authorize('Admin', 'Agent'), asyncHandler(async (_req, res) => {
  res.json(success(await RecruitmentService.getInterviews()))
}))

router.post('/interviews', authorize('Admin', 'Agent'), asyncHandler(async (req, res) => {
  const interview = await RecruitmentService.createInterview({ ...req.body, id_agent: req.user.id_emp })
  res.status(201).json(success(interview))
}))

router.patch('/interviews/:id', authorize('Admin', 'Agent'), asyncHandler(async (req, res) => {
  const interview = await RecruitmentService.updateInterview(Number(req.params.id), req.body)
  res.json(success(interview))
}))

router.delete('/interviews/:id', authorize('Admin'), asyncHandler(async (req, res) => {
  await RecruitmentService.deleteInterview(Number(req.params.id))
  res.json(success(null, 'Entretien supprimé'))
}))

// Dashboard stats
router.get('/stats', authorize('Admin', 'Agent'), asyncHandler(async (_req, res) => {
  res.json(success(await RecruitmentService.getRecruitmentStats()))
}))

export default router
