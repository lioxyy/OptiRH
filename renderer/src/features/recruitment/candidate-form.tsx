import * as React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { candidateService } from './candidate.service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function CandidateForm() {
  const { id } = useParams()
  const numericId = id ? Number(id) : undefined
  const qc = useQueryClient()
  const navigate = useNavigate()

  const { data: existing } = useQuery({
    queryKey: ['candidate', numericId],
    queryFn: () => (numericId ? candidateService.getCandidate(numericId) : Promise.resolve(null)),
    enabled: !!numericId,
  })

  const createMut = useMutation({
    mutationFn: (payload: any) => candidateService.createCandidate(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['candidates'] }),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, patch }: any) => candidateService.updateCandidate(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['candidates'] }),
  })

  const [form, setForm] = React.useState(() => ({
    name: existing?.name ?? '',
    role: existing?.role ?? '',
    source: existing?.source ?? '',
    recruiter: existing?.recruiter ?? '',
    stage: existing?.stage ?? 'Applied',
    score: existing?.score ?? 75,
  }))

  React.useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name,
        role: existing.role,
        source: existing.source,
        recruiter: existing.recruiter,
        stage: existing.stage,
        score: existing.score,
      })
    }
  }, [existing])

  function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setForm((s) => ({ ...s, [name]: value }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      name: form.name,
      role: form.role,
      source: form.source,
      recruiter: form.recruiter,
      stage: form.stage,
      status: 'active',
      score: Number(form.score),
      lastUpdate: 'Created',
      daysInStage: 0,
      timeline: [
        { label: 'Applied', detail: 'Created via admin', completed: true },
        { label: 'Screening', detail: 'Not started', completed: false },
        { label: 'Interview', detail: 'Not started', completed: false },
        { label: 'Offer', detail: 'Not started', completed: false },
        { label: 'Hired', detail: 'Not started', completed: false },
      ],
    }

    if (numericId) {
      await updateMut.mutateAsync({ id: numericId, patch: payload })
    } else {
      await createMut.mutateAsync(payload)
    }

    navigate('/dashboard/recruitment')
  }

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>{numericId ? 'Edit candidate' : 'New candidate'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-3">
            <Input name="name" value={form.name} onChange={onChange} placeholder="Full name" />
            <Input name="role" value={form.role} onChange={onChange} placeholder="Role / position" />
            <Input name="source" value={form.source} onChange={onChange} placeholder="Source (Referral, LinkedIn...)" />
            <Input name="recruiter" value={form.recruiter} onChange={onChange} placeholder="Assigned recruiter" />
            <div className="flex gap-2">
              <select name="stage" value={form.stage} onChange={onChange} className="rounded-md border px-3 py-2">
                <option>Applied</option>
                <option>Screening</option>
                <option>Interview</option>
                <option>Offer</option>
                <option>Hired</option>
                <option>Rejected</option>
              </select>
              <Input name="score" value={String(form.score)} onChange={onChange} placeholder="Score" />
            </div>
            <div className="flex gap-2">
              <Button type="submit">Save</Button>
              <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
