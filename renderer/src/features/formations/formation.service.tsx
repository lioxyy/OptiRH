import { api } from '../../lib/api'
import type { Formation, CreateFormationPayload, UpdateFormationPayload, EmployeeRef, Participant } from './types'

export async function listFormations(): Promise<Formation[]> {
  const res = await api.get('/api/formations')
  return res.data.data
}

export async function getFormation(id: number): Promise<Formation> {
  const res = await api.get(`/api/formations/${id}`)
  return res.data.data
}

export async function createFormation(payload: CreateFormationPayload) {
  const res = await api.post('/api/formations', payload)
  return res.data.data
}

export async function updateFormation(id: number, payload: UpdateFormationPayload) {
  const res = await api.patch(`/api/formations/${id}`, payload)
  return res.data.data
}

export async function deleteFormation(id: number) {
  const res = await api.delete(`/api/formations/${id}`)
  return res.data
}

export async function assignInstructor(id: number, instructor_id: number) {
  const res = await api.post(`/api/formations/${id}/assign-instructor`, { instructor_id })
  return res.data.data
}

export async function scheduleFormation(id: number, date_deb?: string, duration_days?: number) {
  const res = await api.post(`/api/formations/${id}/schedule`, { date_deb, duration_days })
  return res.data.data
}

export async function listEmployees(): Promise<EmployeeRef[]> {
  const res = await api.get('/api/employees')
  return res.data.data
}

export async function getParticipants(id: number): Promise<Participant[]> {
  const res = await api.get(`/api/formations/${id}/participants`)
  return res.data.data
}

export async function addParticipant(id: number, emp_id: number): Promise<void> {
  await api.post(`/api/formations/${id}/participants`, { emp_id })
}

export async function removeParticipant(id: number, empId: number): Promise<void> {
  await api.delete(`/api/formations/${id}/participants/${empId}`)
}
