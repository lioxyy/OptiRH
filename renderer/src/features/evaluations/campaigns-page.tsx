import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getCampaigns, createCampaign } from './api'

export function CampaignsPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    type: 'Annuelle',
    date_start: '',
    date_end: '',
    description: '',
  })

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: getCampaigns,
  })

  const mutation = useMutation({
    mutationFn: createCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      setShowForm(false)
      setFormData({ title: '', type: 'Annuelle', date_start: '', date_end: '', description: '' })
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate(formData)
  }

  if (isLoading) return <div>Chargement...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Campagnes d'Évaluation</h2>
          <p className="text-muted-foreground">Gérez les différentes périodes d'évaluation.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Annuler' : 'Nouvelle Campagne'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Créer une Nouvelle Campagne</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Titre</label>
                  <input 
                    required 
                    className="flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type</label>
                  <select 
                    className="flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="Annuelle">Annuelle</option>
                    <option value="Semestrielle">Semestrielle</option>
                    <option value="Trimestrielle">Trimestrielle</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date de début</label>
                  <input 
                    required 
                    type="date"
                    className="flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                    value={formData.date_start}
                    onChange={(e) => setFormData({ ...formData, date_start: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date de fin</label>
                  <input 
                    required 
                    type="date"
                    className="flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                    value={formData.date_end}
                    onChange={(e) => setFormData({ ...formData, date_end: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea 
                  className="flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
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
                <th className="p-4 text-left font-medium">Titre</th>
                <th className="p-4 text-left font-medium">Type</th>
                <th className="p-4 text-left font-medium">Période</th>
                <th className="p-4 text-left font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {campaigns?.map((camp: any) => (
                <tr key={camp.id_campaign} className="border-b">
                  <td className="p-4 font-medium">{camp.title}</td>
                  <td className="p-4">{camp.type}</td>
                  <td className="p-4">
                    {format(new Date(camp.date_start), 'dd/MM/yyyy')} - {format(new Date(camp.date_end), 'dd/MM/yyyy')}
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                      {camp.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
