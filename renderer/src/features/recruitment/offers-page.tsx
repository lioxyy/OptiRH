import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { PlusIcon, PencilIcon, TrashIcon, GlobeIcon, ArchiveIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getJobOffers, createJobOffer, updateJobOffer, deleteJobOffer } from './api'

const STATUS_STYLES: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-700',
  Published: 'bg-green-100 text-green-700',
  Closed: 'bg-red-100 text-red-700',
}

const STATUS_LABELS: Record<string, string> = {
  Draft: 'Brouillon',
  Published: 'Publié',
  Closed: 'Archivé',
}

const EMPTY_FORM = {
  title: '', description: '', department: '', contract_type: 'CDI',
  salary: '', location: '', date_expiration: '', status: 'Draft'
}

export function OffersPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingOffer, setEditingOffer] = useState<any>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const { data: offers = [], isLoading } = useQuery({ queryKey: ['job-offers'], queryFn: getJobOffers })

  const createMutation = useMutation({
    mutationFn: createJobOffer,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['job-offers'] }); resetForm() }
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => updateJobOffer(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['job-offers'] }); resetForm() }
  })
  const deleteMutation = useMutation({
    mutationFn: deleteJobOffer,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['job-offers'] })
  })

  const resetForm = () => { setShowForm(false); setEditingOffer(null); setForm(EMPTY_FORM) }
  const handleEdit = (offer: any) => {
    setEditingOffer(offer)
    setForm({
      title: offer.title, description: offer.description, department: offer.department,
      contract_type: offer.contract_type, salary: offer.salary || '', location: offer.location || '',
      date_expiration: offer.date_expiration ? offer.date_expiration.split('T')[0] : '', status: offer.status
    })
    setShowForm(true)
  }
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      ...form,
      date_expiration: form.date_expiration ? new Date(form.date_expiration).toISOString() : undefined,
      ...(form.status === 'Published' && !editingOffer?.date_publication && { date_publication: new Date().toISOString() })
    }
    if (editingOffer) updateMutation.mutate({ id: editingOffer.id_offer, data: payload })
    else createMutation.mutate(payload)
  }
  const handlePublish = (offer: any) => {
    updateMutation.mutate({ id: offer.id_offer, data: { status: 'Published', date_publication: new Date().toISOString() } })
  }
  const handleClose = (offer: any) => {
    updateMutation.mutate({ id: offer.id_offer, data: { status: 'Closed' } })
  }

  if (isLoading) return <div className="p-6">Chargement...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Offres d'Emploi</h2>
          <p className="text-muted-foreground">Créez, publiez et gérez vos offres.</p>
        </div>
        <Button onClick={() => { setShowForm(true); setEditingOffer(null); setForm(EMPTY_FORM) }}>
          <PlusIcon className="mr-2 h-4 w-4" /> Nouvelle Offre
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold text-lg mb-4">{editingOffer ? 'Modifier l\'offre' : 'Créer une offre'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Titre du poste *</label>
                  <input required className="flex h-10 w-full rounded-md border px-3 py-2 text-sm" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Département *</label>
                  <input required className="flex h-10 w-full rounded-md border px-3 py-2 text-sm" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Type de contrat</label>
                  <select className="flex h-10 w-full rounded-md border px-3 py-2 text-sm" value={form.contract_type} onChange={e => setForm({ ...form, contract_type: e.target.value })}>
                    {['CDI', 'CDD', 'Stage', 'Freelance', 'Alternance'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Salaire</label>
                  <input className="flex h-10 w-full rounded-md border px-3 py-2 text-sm" placeholder="Ex: 35 000 - 45 000 DZD" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Localisation</label>
                  <input className="flex h-10 w-full rounded-md border px-3 py-2 text-sm" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Date d'expiration</label>
                  <input type="date" className="flex h-10 w-full rounded-md border px-3 py-2 text-sm" value={form.date_expiration} onChange={e => setForm({ ...form, date_expiration: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Description *</label>
                <textarea required rows={5} className="flex w-full rounded-md border px-3 py-2 text-sm" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Statut</label>
                <select className="flex h-10 w-full rounded-md border px-3 py-2 text-sm" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="Draft">Brouillon</option>
                  <option value="Published">Publié</option>
                  <option value="Closed">Archivé</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>Annuler</Button>
                <Button type="submit">{editingOffer ? 'Enregistrer' : 'Créer'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {offers.map((offer: any) => (
          <Card key={offer.id_offer}>
            <CardContent className="p-4 flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-base">{offer.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[offer.status]}`}>
                    {STATUS_LABELS[offer.status] || offer.status}
                  </span>
                  <span className="text-xs bg-muted px-2 py-0.5 rounded">{offer.contract_type}</span>
                </div>
                <p className="text-sm text-muted-foreground">{offer.department} {offer.location && `· ${offer.location}`} {offer.salary && `· ${offer.salary}`}</p>
                <p className="text-xs text-muted-foreground">
                  {offer._count.applications} candidature(s)
                  {offer.date_expiration && ` · Expire le ${format(new Date(offer.date_expiration), 'dd/MM/yyyy')}`}
                </p>
              </div>
              <div className="flex gap-2 items-center">
                {offer.status === 'Draft' && (
                  <Button size="sm" variant="outline" onClick={() => handlePublish(offer)}>
                    <GlobeIcon className="h-4 w-4 mr-1" /> Publier
                  </Button>
                )}
                {offer.status === 'Published' && (
                  <Button size="sm" variant="outline" onClick={() => handleClose(offer)}>
                    <ArchiveIcon className="h-4 w-4 mr-1" /> Archiver
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => handleEdit(offer)}>
                  <PencilIcon className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteMutation.mutate(offer.id_offer)}>
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {offers.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">Aucune offre. Créez votre première offre !</div>
        )}
      </div>
    </div>
  )
}
