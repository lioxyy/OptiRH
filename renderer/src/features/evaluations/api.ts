import { api } from '@/lib/api'

export const getCampaigns = async () => {
  const { data } = await api.get('/api/evaluations/campaigns')
  return data.data
}

export const createCampaign = async (payload: any) => {
  const { data } = await api.post('/api/evaluations/campaigns', payload)
  return data.data
}

export const getCriteria = async () => {
  const { data } = await api.get('/api/evaluations/criteria')
  return data.data
}

export const createCriteria = async (payload: any) => {
  const { data } = await api.post('/api/evaluations/criteria', payload)
  return data.data
}

export const getDashboardStats = async () => {
  const { data } = await api.get('/api/evaluations/dashboard')
  return data.data
}

export const getEmployeeEvals = async (id: number) => {
  const { data } = await api.get(`/api/evaluations/employee/${id}`)
  return data.data
}

export const getMyEvaluations = async () => {
  const { data } = await api.get('/api/evaluations/my-evaluations')
  return data.data
}

export const getEvaluationsHistory = async () => {
  const { data } = await api.get('/api/evaluations/history')
  return data.data
}

export const submitEvaluation = async (payload: any) => {
  const { data } = await api.post('/api/evaluations/submit', payload)
  return data.data
}
