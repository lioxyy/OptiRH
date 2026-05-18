import { api } from '@/lib/api'

// ─── JOB OFFERS ───────────────────────────────────────────────
export const getJobOffers = async () => {
  const { data } = await api.get('/api/recruitment/offers')
  return data.data
}
export const getPublishedOffers = async () => {
  const { data } = await api.get('/api/recruitment/offers/public')
  return data.data
}
export const createJobOffer = async (payload: any) => {
  const { data } = await api.post('/api/recruitment/offers', payload)
  return data.data
}
export const updateJobOffer = async (id: number, payload: any) => {
  const { data } = await api.patch(`/api/recruitment/offers/${id}`, payload)
  return data.data
}
export const deleteJobOffer = async (id: number) => {
  const { data } = await api.delete(`/api/recruitment/offers/${id}`)
  return data.data
}

// ─── CANDIDATES ───────────────────────────────────────────────
export const getCandidates = async () => {
  const { data } = await api.get('/api/recruitment/candidates')
  return data.data
}
export const getCandidateById = async (id: number) => {
  const { data } = await api.get(`/api/recruitment/candidates/${id}`)
  return data.data
}
export const createCandidate = async (formData: FormData) => {
  const { data } = await api.post('/api/recruitment/candidates', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return data.data
}
export const updateCandidate = async (id: number, formData: FormData) => {
  const { data } = await api.patch(`/api/recruitment/candidates/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return data.data
}
export const deleteCandidate = async (id: number) => {
  const { data } = await api.delete(`/api/recruitment/candidates/${id}`)
  return data.data
}

// ─── APPLICATIONS ─────────────────────────────────────────────
export const getApplications = async () => {
  const { data } = await api.get('/api/recruitment/applications')
  return data.data
}
export const createApplication = async (payload: any) => {
  const { data } = await api.post('/api/recruitment/applications', payload)
  return data.data
}
export const updateApplicationStatus = async (id: number, status: string, notes?: string) => {
  const { data } = await api.patch(`/api/recruitment/applications/${id}/status`, { status, notes })
  return data.data
}
export const deleteApplication = async (id: number) => {
  const { data } = await api.delete(`/api/recruitment/applications/${id}`)
  return data.data
}
export const promoteToEmployee = async (id: number, payload: any) => {
  const { data } = await api.post(`/api/recruitment/applications/${id}/promote`, payload)
  return data.data
}
export const applyPublic = async (formData: FormData) => {
  const { data } = await api.post('/api/recruitment/apply', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return data.data
}

// ─── INTERVIEWS ───────────────────────────────────────────────
export const getInterviews = async () => {
  const { data } = await api.get('/api/recruitment/interviews')
  return data.data
}
export const createInterview = async (payload: any) => {
  const { data } = await api.post('/api/recruitment/interviews', payload)
  return data.data
}
export const updateInterview = async (id: number, payload: any) => {
  const { data } = await api.patch(`/api/recruitment/interviews/${id}`, payload)
  return data.data
}
export const deleteInterview = async (id: number) => {
  const { data } = await api.delete(`/api/recruitment/interviews/${id}`)
  return data.data
}

// ─── STATS ────────────────────────────────────────────────────
export const getRecruitmentStats = async () => {
  const { data } = await api.get('/api/recruitment/stats')
  return data.data
}
