import { api } from '@/lib/api'
import type { Agent, CreateAgentPayload, Department, TeamMember, UpdateAgentPayload } from './types'

export const agentsService = {
  async listAgents(): Promise<Agent[]> {
    const res = await api.get('/api/agents')
    return res.data.data
  },

  async getAgent(id: number): Promise<Agent> {
    const res = await api.get(`/api/agents/${id}`)
    return res.data.data
  },

  async createAgent(payload: CreateAgentPayload): Promise<Agent> {
    const res = await api.post('/api/agents', payload)
    return res.data.data
  },

  async updateAgent(id: number, payload: UpdateAgentPayload): Promise<Agent> {
    const res = await api.patch(`/api/agents/${id}`, payload)
    return res.data.data
  },

  async deleteAgent(id: number): Promise<void> {
    await api.delete(`/api/agents/${id}`)
  },

  async changeAgentDepartment(id: number, id_dept: number): Promise<Agent> {
    const res = await api.patch(`/api/agents/${id}/department`, { id_dept })
    return res.data.data
  },

  async getAgentTeam(id: number): Promise<TeamMember[]> {
    const res = await api.get(`/api/agents/${id}/team`)
    return res.data.data
  },

  async assignTeamMember(agentId: number, emp_id: number): Promise<void> {
    await api.post(`/api/agents/${agentId}/team`, { emp_id })
  },

  async removeTeamMember(agentId: number, empId: number): Promise<void> {
    await api.delete(`/api/agents/${agentId}/team/${empId}`)
  },

  async listDepartments(): Promise<Department[]> {
    const res = await api.get('/api/employees/departments')
    return res.data.data
  },

  async listAllEmployees(): Promise<{ id_emp: number; name: string; role: string }[]> {
    const res = await api.get('/api/employees')
    return res.data.data
  },
}
