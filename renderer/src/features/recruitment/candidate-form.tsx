import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'

interface CandidateFormProps {
  onClose: () => void
}

export function CandidateForm({ onClose }: CandidateFormProps) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [position, setPosition] = useState('')
  const [departmentId, setDepartmentId] = useState<number | ''>('')
  const [error, setError] = useState<string | null>(null)

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await api.get('/api/employees/departments')
      return res.data.data
    }
  })

  const mutation = useMutation({
    mutationFn: async () => {
      await api.post('/api/recruitment', {
        name,
        email,
        post_applied: position || undefined,
        id_dept: departmentId || undefined,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruitment'] })
      onClose()
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to create candidate')
    }
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Add Candidate</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md font-medium">{error}</div>}

          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Full name" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Email" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Position Applied</label>
            <input value={position} onChange={(e) => setPosition(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="e.g. Software Engineer" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Department</label>
            <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value ? Number(e.target.value) : '')}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="">Select...</option>
              {departments.map((dept: any) => (
                <option key={dept.id_dept} value={dept.id_dept}>{dept.name}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>Cancel</Button>
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !name || !email}>
              {mutation.isPending ? 'Saving...' : 'Add Candidate'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
