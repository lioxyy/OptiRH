import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { UserIcon, UploadIcon, PencilIcon, TrashIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getCandidates, createCandidate, updateCandidate, deleteCandidate } from './api'

export function CandidatesPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [lettreFile, setLettreFile] = useState<File | null>(null)
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', telephone: '', address: '' })

  const { data: candidates = [], isLoading } = useQuery({ queryKey: ['candidates'], queryFn: getCandidates })

  const createMutation = useMutation({
    mutationFn: createCandidate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['candidates'] }); resetForm() }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, fd }: { id: number, fd: FormData }) => updateCandidate(id, fd),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['candidates'] }); resetForm() }
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCandidate,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['candidates'] })
  })

  const resetForm = () => {
    setShowForm(false)
    setEditingId(null)
    setForm({ nom: '', prenom: '', email: '', telephone: '', address: '' })
    setCvFile(null)
    setLettreFile(null)
  }

  const handleEdit = (c: any) => {
    setEditingId(c.id_cand)
    setForm({
      nom: c.nom,
      prenom: c.prenom,
      email: c.email,
      telephone: c.telephone || '',
      address: c.address || ''
    })
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, v))
    if (cvFile) fd.append('cv', cvFile)
    if (lettreFile) fd.append('lettre', lettreFile)

    if (editingId) {
      updateMutation.mutate({ id: editingId, fd })
    } else {
      createMutation.mutate(fd)
    }
  }

  if (isLoading) return <div className="p-6">Chargement...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Candidats</h2>
          <p className="text-muted-foreground">Base de données de tous les candidats.</p>
        </div>
        <Button onClick={() => { if (showForm) resetForm(); else setShowForm(true) }}>
          {showForm ? 'Annuler' : 'Ajouter un Candidat'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Modifier le Candidat' : 'Nouveau Candidat'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Nom *</label>
                  <input required className="flex h-10 w-full rounded-md border px-3 py-2 text-sm" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Prénom *</label>
                  <input required className="flex h-10 w-full rounded-md border px-3 py-2 text-sm" value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Email *</label>
                  <input required type="email" className="flex h-10 w-full rounded-md border px-3 py-2 text-sm" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Téléphone</label>
                  <input className="flex h-10 w-full rounded-md border px-3 py-2 text-sm" value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Adresse</label>
                <input className="flex h-10 w-full rounded-md border px-3 py-2 text-sm" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
              </div>

              {/* File Uploads */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium flex items-center gap-1"><UploadIcon className="h-3 w-3" /> CV (PDF/DOC)</label>
                  <label className={`flex flex-col items-center justify-center h-20 w-full border-2 border-dashed rounded-md cursor-pointer transition-colors ${cvFile ? 'border-green-400 bg-green-50' : 'hover:border-primary'}`}>
                    <span className="text-xs text-muted-foreground">{cvFile ? cvFile.name : 'Cliquer pour sélectionner'}</span>
                    <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={e => setCvFile(e.target.files?.[0] || null)} />
                  </label>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium flex items-center gap-1"><UploadIcon className="h-3 w-3" /> Lettre de Motivation</label>
                  <label className={`flex flex-col items-center justify-center h-20 w-full border-2 border-dashed rounded-md cursor-pointer transition-colors ${lettreFile ? 'border-green-400 bg-green-50' : 'hover:border-primary'}`}>
                    <span className="text-xs text-muted-foreground">{lettreFile ? lettreFile.name : 'Cliquer pour sélectionner'}</span>
                    <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={e => setLettreFile(e.target.files?.[0] || null)} />
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>Annuler</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-4 text-left font-medium">Candidat</th>
                <th className="p-4 text-left font-medium">Contact</th>
                <th className="p-4 text-left font-medium">Documents</th>
                <th className="p-4 text-left font-medium">Candidatures</th>
                <th className="p-4 text-left font-medium">Inscrit le</th>
                <th className="p-4 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((c: any) => (
                <tr key={c.id_cand} className="border-b hover:bg-muted/30">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserIcon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{c.prenom} {c.nom}</p>
                        <p className="text-xs text-muted-foreground">{c.address || ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p>{c.email}</p>
                    <p className="text-muted-foreground">{c.telephone || 'N/A'}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1">
                      {c.cv_path && <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded">CV ✓</span>}
                      {c.lettre_path && <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded">LM ✓</span>}
                      {!c.cv_path && !c.lettre_path && <span className="text-muted-foreground text-xs">Aucun</span>}
                    </div>
                  </td>
                  <td className="p-4 font-medium">{c._count.applications}</td>
                  <td className="p-4 text-muted-foreground">{format(new Date(c.date_inscription), 'dd/MM/yyyy')}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(c)}>
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive"
                        onClick={() => confirm('Supprimer ce candidat ?') && deleteMutation.mutate(c.id_cand)}>
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {candidates.length === 0 && <p className="text-center py-10 text-muted-foreground">Aucun candidat enregistré.</p>}
        </CardContent>
      </Card>
    </div>
  )
}
