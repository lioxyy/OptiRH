import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getCriteria, createCriteria } from './api'

export function CriteriaPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    weight: 10,
    max_score: 20,
  })

  const { data: criteriaList, isLoading } = useQuery({
    queryKey: ['criteria'],
    queryFn: getCriteria,
  })

  const mutation = useMutation({
    mutationFn: createCriteria,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['criteria'] })
      setShowForm(false)
      setFormData({ name: '', description: '', weight: 10, max_score: 20 })
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate(formData)
  }

  if (isLoading) return <div>Chargement...</div>

  // Calcul du poids total actuel
  const totalWeight = criteriaList?.reduce((sum: number, c: any) => sum + c.weight, 0) || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Critères d'Évaluation</h2>
          <p className="text-muted-foreground">Définissez les critères sur lesquels les employés seront évalués.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Annuler' : 'Nouveau Critère'}
        </Button>
      </div>

      <div className="bg-primary/10 border border-primary/20 p-4 rounded-md text-primary">
        <p className="font-semibold text-sm">Poids total configuré : {totalWeight}% / 100%</p>
        {totalWeight !== 100 && <p className="text-xs mt-1">Attention, il est recommandé que la somme des poids atteigne exactement 100%.</p>}
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Créer un Nouveau Critère</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nom du critère</label>
                  <input 
                    required 
                    className="flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Poids (%)</label>
                  <input 
                    required 
                    type="number"
                    min="1"
                    max="100"
                    className="flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Note maximale (ex: 20)</label>
                  <input 
                    required 
                    type="number"
                    min="1"
                    className="flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                    value={formData.max_score}
                    onChange={(e) => setFormData({ ...formData, max_score: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <input 
                    className="flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {criteriaList?.map((c: any) => (
          <Card key={c.id_criteria}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{c.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{c.description || 'Aucune description'}</p>
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="bg-muted px-2 py-1 rounded">Poids: {c.weight}%</span>
                <span className="bg-muted px-2 py-1 rounded">Sur {c.max_score} pts</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
