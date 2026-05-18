import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { PlusIcon, CalendarIcon, TrashIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getInterviews, createInterview, updateInterview, deleteInterview } from './api'

const RESULT_STYLES: Record<string, string> = {
  'Validé': 'text-green-600 font-semibold',
  'Rejeté': 'text-red-600 font-semibold',
  'SecondEntretien': 'text-yellow-600 font-semibold',
}

const STATUS_STYLES: Record<string, string> = {
  'Planifié': 'bg-blue-100 text-blue-800',
  'Terminé': 'bg-gray-100 text-gray-700',
  'Annulé': 'bg-red-100 text-red-700',
}

export function InterviewsPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({
    id_cand: '', id_application: '', date: '', heure: '', lieu: '',
    feedback: '', result: '', status: 'Planifié'
  })

  const { data: interviews = [], isLoading } = useQuery({ queryKey: ['interviews'], queryFn: getInterviews })

  const createMutation = useMutation({
    mutationFn: createInterview,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['interviews'] }); resetForm() }
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => updateInterview(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['interviews'] }); resetForm() }
  })
  const deleteMutation = useMutation({
    mutationFn: deleteInterview,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['interviews'] })
  })

  const resetForm = () => { setShowForm(false); setEditingId(null); setForm({ id_cand: '', id_application: '', date: '', heure: '', lieu: '', feedback: '', result: '', status: 'Planifié' }) }

  const handleEdit = (interview: any) => {
    const dt = new Date(interview.date_heure)
    setEditingId(interview.id_entretien)
    setForm({
      id_cand: interview.id_cand,
      id_application: interview.id_application || '',
      date: dt.toISOString().split('T')[0],
      heure: `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`,
      lieu: interview.lieu || '',
      feedback: interview.feedback || '',
      result: interview.result || '',
      status: interview.status,
    })
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const date_heure = new Date(`${form.date}T${form.heure}`).toISOString()
    const payload = {
      date_heure,
      lieu: form.lieu,
      feedback: form.feedback || undefined,
      result: form.result || undefined,
      status: form.status,
      id_cand: Number(form.id_cand),
      id_application: form.id_application ? Number(form.id_application) : undefined,
    }
    if (editingId) updateMutation.mutate({ id: editingId, data: payload })
    else createMutation.mutate(payload)
  }

  // Group by upcoming vs past
  const now = new Date()
  const upcoming = interviews.filter((i: any) => new Date(i.date_heure) >= now)
  const past = interviews.filter((i: any) => new Date(i.date_heure) < now)

  if (isLoading) return <div className="p-6">Chargement...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Entretiens</h2>
          <p className="text-muted-foreground">Planifiez et suivez tous les entretiens.</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <PlusIcon className="mr-2 h-4 w-4" /> Planifier un Entretien
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>{editingId ? 'Modifier' : 'Planifier'} un entretien</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">ID Candidat *</label>
                  <input required type="number" className="flex h-10 w-full rounded-md border px-3 py-2 text-sm" value={form.id_cand} onChange={e => setForm({ ...form, id_cand: e.target.value })} placeholder="Ex: 1" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">ID Candidature (optionnel)</label>
                  <input type="number" className="flex h-10 w-full rounded-md border px-3 py-2 text-sm" value={form.id_application} onChange={e => setForm({ ...form, id_application: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Date *</label>
                  <input required type="date" className="flex h-10 w-full rounded-md border px-3 py-2 text-sm" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Heure *</label>
                  <input required type="time" className="flex h-10 w-full rounded-md border px-3 py-2 text-sm" value={form.heure} onChange={e => setForm({ ...form, heure: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Lieu</label>
                  <input className="flex h-10 w-full rounded-md border px-3 py-2 text-sm" value={form.lieu} onChange={e => setForm({ ...form, lieu: e.target.value })} placeholder="Ex: Salle B3 / Teams" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Statut</label>
                  <select className="flex h-10 w-full rounded-md border px-3 py-2 text-sm" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option>Planifié</option><option>Terminé</option><option>Annulé</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Résultat</label>
                  <select className="flex h-10 w-full rounded-md border px-3 py-2 text-sm" value={form.result} onChange={e => setForm({ ...form, result: e.target.value })}>
                    <option value="">En attente...</option>
                    <option value="Validé">Validé ✓</option>
                    <option value="Rejeté">Rejeté ✗</option>
                    <option value="SecondEntretien">Second Entretien</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Feedback / Notes</label>
                <textarea rows={3} className="flex w-full rounded-md border px-3 py-2 text-sm" value={form.feedback} onChange={e => setForm({ ...form, feedback: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>Annuler</Button>
                <Button type="submit">{editingId ? 'Enregistrer' : 'Planifier'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Upcoming */}
      <div>
        <h3 className="font-semibold mb-3 flex items-center gap-2"><CalendarIcon className="h-4 w-4" /> À venir ({upcoming.length})</h3>
        <div className="space-y-3">
          {upcoming.map((i: any) => (
            <Card key={i.id_entretien}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{i.candidat.prenom} {i.candidat.nom}</p>
                  <p className="text-sm text-muted-foreground">{i.application?.offer?.title || 'Offre non spécifiée'}</p>
                  <p className="text-sm">{format(new Date(i.date_heure), 'dd/MM/yyyy à HH:mm')} {i.lieu && `· ${i.lieu}`}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_STYLES[i.status]}`}>{i.status}</span>
                  <Button size="sm" variant="outline" onClick={() => handleEdit(i)}>Modifier</Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => confirm('Supprimer cet entretien ?') && deleteMutation.mutate(i.id_entretien)}>
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {upcoming.length === 0 && <p className="text-sm text-muted-foreground">Aucun entretien prévu.</p>}
        </div>
      </div>

      {/* Past */}
      {past.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3 text-muted-foreground">Passés ({past.length})</h3>
          <div className="space-y-2">
            {past.map((i: any) => (
              <Card key={i.id_entretien} className="opacity-70">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{i.candidat.prenom} {i.candidat.nom}</p>
                    <p className="text-sm text-muted-foreground">{format(new Date(i.date_heure), 'dd/MM/yyyy à HH:mm')}</p>
                    {i.feedback && <p className="text-xs text-muted-foreground italic mt-1">"{i.feedback}"</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    {i.result && <span className={RESULT_STYLES[i.result] || ''}>{i.result}</span>}
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(i)}>Compléter</Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => confirm('Supprimer cet entretien ?') && deleteMutation.mutate(i.id_entretien)}>
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
