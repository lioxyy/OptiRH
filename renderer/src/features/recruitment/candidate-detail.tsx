import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { candidateService } from './candidate.service'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export default function CandidateDetail() {
  const { id } = useParams()
  const numericId = Number(id)
  const qc = useQueryClient()
  const navigate = useNavigate()

  const { data: candidate, isLoading } = useQuery({
    queryKey: ['candidate', numericId],
    queryFn: () => candidateService.getCandidate(numericId),
    enabled: !!numericId,
  })

  const deleteMut = useMutation({
    mutationFn: (cid: number) => candidateService.deleteCandidate(cid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['candidates'] })
      navigate('/dashboard/recruitment')
    },
  })

  if (isLoading || !candidate) return <div className="p-6">Loading...</div>

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{candidate.name}</h1>
          <p className="text-sm text-muted-foreground">{candidate.role} · {candidate.recruiter}</p>
        </div>
        <div className="flex gap-2">
          <Link to={`/dashboard/recruitment/candidates/${candidate.id}/edit`}>
            <Button variant="outline">Edit</Button>
          </Link>
          <Button variant="destructive" onClick={() => deleteMut.mutate(candidate.id)}>Delete</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Candidate overview</CardTitle>
          <CardDescription>Details, timeline and current status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Stage</span>
                <Badge variant="outline">{candidate.stage}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Score</p>
                <p className="text-lg font-semibold">{candidate.score}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Source</p>
                <p className="text-sm">{candidate.source}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Last update</p>
                <p className="text-sm">{candidate.lastUpdate}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Days in stage</p>
                <p className="text-sm">{candidate.daysInStage}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Recruiter</p>
                <p className="text-sm">{candidate.recruiter}</p>
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="space-y-3">
            {candidate.timeline.map((t) => (
              <div key={t.label} className="rounded-xl border p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{t.label}</p>
                  <span className="text-sm text-muted-foreground">{t.completed ? 'Completed' : 'Pending'}</span>
                </div>
                <p className="text-sm text-muted-foreground">{t.detail}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
