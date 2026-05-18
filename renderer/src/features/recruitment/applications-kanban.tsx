import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useQueryClient as useQC } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ArrowRightIcon, CheckCircleIcon, XCircleIcon, TrashIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getApplications, updateApplicationStatus, promoteToEmployee, deleteApplication } from './api'
import { api } from '@/lib/api'

const getDepartments = async () => {
  const { data } = await api.get('/api/employees/departments')
  return data.data
}

const COLUMNS = [
  { id: 'Reçue', label: 'Reçue 📥', color: 'border-blue-400' },
  { id: 'EnCours', label: 'Shortlist ⭐️', color: 'border-yellow-400' },
  { id: 'Entretien', label: 'Entretien 📅', color: 'border-purple-400' },
  { id: 'Acceptée', label: 'Acceptée ✓', color: 'border-green-400' },
  { id: 'Rejetée', label: 'Rejetée ✗', color: 'border-red-400' },
]

const NEXT_STATUS: Record<string, string> = {
  'Reçue': 'EnCours',
  'EnCours': 'Entretien',
  'Entretien': 'Acceptée',
}

const STATUS_LABELS: Record<string, string> = {
  'Reçue': 'Reçue',
  'EnCours': 'Shortlist',
  'Entretien': 'Entretien',
  'Acceptée': 'Acceptée',
  'Rejetée': 'Rejetée',
}

export function ApplicationsKanban() {
  const qc = useQueryClient()
  const [selected, setSelected] = useState<any>(null)
  const [showPromote, setShowPromote] = useState(false)
  const [promoteForm, setPromoteForm] = useState({ role: 'Employee', id_dept: '' })
  const [rejectNote, setRejectNote] = useState('')

  const { data: applications = [], isLoading } = useQuery({ queryKey: ['applications'], queryFn: getApplications })
  const { data: departments = [] } = useQuery({ queryKey: ['departments'], queryFn: getDepartments })

  const statusMutation = useMutation({
    mutationFn: ({ id, status, notes }: any) => updateApplicationStatus(id, status, notes),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['applications'] }); setSelected(null) }
  })
  const promoteMutation = useMutation({
    mutationFn: ({ id, data }: any) => promoteToEmployee(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['applications'] }); setShowPromote(false); setSelected(null) }
  })
  const deleteMutation = useMutation({
    mutationFn: deleteApplication,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['applications'] }); setSelected(null) }
  })

  if (isLoading) return <div className="p-6">Chargement du pipeline...</div>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Pipeline des Candidatures</h2>
        <p className="text-muted-foreground">Suivez et gérez chaque candidature en temps réel.</p>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const colApps = applications.filter((a: any) => a.status === col.id)
          return (
            <div key={col.id} className={`min-w-[240px] flex-1 rounded-lg border-t-4 bg-muted/30 p-3 ${col.color}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">{col.label}</h3>
                <span className="bg-background text-xs font-bold px-2 py-0.5 rounded-full border">{colApps.length}</span>
              </div>
              <div className="space-y-2">
                {colApps.map((app: any) => (
                  <div
                    key={app.id_application}
                    className="bg-background border rounded-md p-3 cursor-pointer hover:border-primary transition-colors shadow-sm"
                    onClick={() => setSelected(app)}
                  >
                    <p className="font-medium text-sm">{app.candidat.prenom} {app.candidat.nom}</p>
                    <p className="text-xs text-muted-foreground mt-1 truncate">{app.offer.title}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(app.date_postulation), 'dd/MM/yyyy')}</p>
                  </div>
                ))}
                {colApps.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Aucune candidature</p>}
              </div>
            </div>
          )
        })}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <Card className="w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>Candidature — {selected.candidat.prenom} {selected.candidat.nom}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="font-medium">Email :</span> {selected.candidat.email}</div>
                <div><span className="font-medium">Téléphone :</span> {selected.candidat.telephone || 'N/A'}</div>
                <div><span className="font-medium">Offre :</span> {selected.offer.title}</div>
                <div><span className="font-medium">Date :</span> {format(new Date(selected.date_postulation), 'dd/MM/yyyy')}</div>
                <div><span className="font-medium">Statut :</span> {selected.status}</div>
                <div><span className="font-medium">Entretiens :</span> {selected.entretiens?.length || 0}</div>
              </div>
              {selected.notes && (
                <div className="bg-muted p-3 rounded text-sm">
                  <span className="font-medium">Notes : </span>{selected.notes}
                </div>
              )}
              {selected.candidat.cv_path && (
                <p className="text-sm text-muted-foreground">📄 CV enregistré : {selected.candidat.cv_path.split(/[/\\]/).pop()}</p>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                {NEXT_STATUS[selected.status] && (
                  <Button size="sm" onClick={() => statusMutation.mutate({ id: selected.id_application, status: NEXT_STATUS[selected.status] })}>
                    <ArrowRightIcon className="h-4 w-4 mr-1" /> → {STATUS_LABELS[NEXT_STATUS[selected.status]]}
                  </Button>
                )}
                {selected.status === 'Acceptée' && (
                  <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => setShowPromote(true)}>
                    <CheckCircleIcon className="h-4 w-4 mr-1" /> Créer Employé
                  </Button>
                )}
                {selected.status !== 'Rejetée' && selected.status !== 'Acceptée' && (
                  <Button size="sm" variant="destructive" onClick={() => {
                    const note = prompt('Raison du rejet (optionnel) :')
                    statusMutation.mutate({ id: selected.id_application, status: 'Rejetée', notes: note || '' })
                  }}>
                    <XCircleIcon className="h-4 w-4 mr-1" /> Rejeter
                  </Button>
                )}
                <Button size="sm" variant="destructive" onClick={() => confirm('Supprimer définitivement cette candidature ?') && deleteMutation.mutate(selected.id_application)}>
                  <TrashIcon className="h-4 w-4 mr-1" /> Supprimer
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSelected(null)}>Fermer</Button>
              </div>

              {/* Promote Form */}
              {showPromote && (
                <div className="border rounded-md p-4 space-y-3 bg-green-50">
                  <h4 className="font-semibold text-sm">Promouvoir en Employé</h4>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Rôle</label>
                    <select className="flex h-9 w-full rounded-md border px-3 text-sm" value={promoteForm.role} onChange={e => setPromoteForm({ ...promoteForm, role: e.target.value })}>
                      {['Employee', 'Agent', 'Admin'].map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Département</label>
                    <select className="flex h-9 w-full rounded-md border px-3 text-sm" value={promoteForm.id_dept} onChange={e => setPromoteForm({ ...promoteForm, id_dept: e.target.value })}>
                      <option value="">Sélectionner...</option>
                      {departments.map((d: any) => <option key={d.id_dept} value={d.id_dept}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" disabled={!promoteForm.id_dept || promoteMutation.isPending}
                      onClick={() => promoteMutation.mutate({ id: selected.id_application, data: { ...promoteForm, id_dept: Number(promoteForm.id_dept) } })}>
                      {promoteMutation.isPending ? 'Création...' : 'Confirmer'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowPromote(false)}>Annuler</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
