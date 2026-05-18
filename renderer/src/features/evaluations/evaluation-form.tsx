import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { getCampaigns, getCriteria, submitEvaluation } from './api'

export function EvaluationForm() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [employees, setEmployees] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [criteria, setCriteria] = useState([])
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    id_emp: '',
    campaign_id: '',
    general_cmt: '',
    decision: 'Moyen',
  })

  // Stocker les scores : Record<id_criteria, { score: number, comment: string }>
  const [scores, setScores] = useState<Record<number, { score: number; comment: string }>>({})

  useEffect(() => {
    // Fetch Employees
    api.get('/api/employees').then((res) => setEmployees(res.data.data))
    // Fetch Campaigns & Criteria
    getCampaigns().then(setCampaigns)
    getCriteria().then((data) => {
      setCriteria(data)
      const initialScores: any = {}
      data.forEach((c: any) => {
        initialScores[c.id_criteria] = { score: 0, comment: '' }
      })
      setScores(initialScores)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const payload = {
        id_emp: formData.id_emp,
        campaign_id: formData.campaign_id,
        general_cmt: formData.general_cmt,
        decision: formData.decision,
        scores: Object.entries(scores).map(([critId, data]) => ({
          criteria_id: critId,
          score: data.score,
          comment: data.comment
        }))
      }

      await submitEvaluation(payload)
      // Invalider les caches pour forcer le rafraîchissement des données
      await queryClient.invalidateQueries({ queryKey: ['evals-history'] })
      await queryClient.invalidateQueries({ queryKey: ['eval-stats'] })
      navigate('/dashboard/evaluations')
    } catch (error) {
      console.error(error)
      alert("Erreur lors de la soumission de l'évaluation")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Nouvelle Évaluation</h2>
        <p className="text-muted-foreground">Évaluez un collaborateur sur les différents critères définis.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informations Générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Employé à évaluer</label>
                <select 
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.id_emp}
                  onChange={(e) => setFormData({ ...formData, id_emp: e.target.value })}
                >
                  <option value="">Sélectionner un employé...</option>
                  {employees.map((emp: any) => (
                    <option key={emp.id_emp} value={emp.id_emp}>{emp.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Campagne d'Évaluation</label>
                <select 
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.campaign_id}
                  onChange={(e) => setFormData({ ...formData, campaign_id: e.target.value })}
                >
                  <option value="">Sélectionner une campagne...</option>
                  {campaigns.map((camp: any) => (
                    <option key={camp.id_campaign} value={camp.id_campaign}>{camp.title}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Notation par Critère</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {criteria.map((c: any) => (
              <div key={c.id_criteria} className="grid grid-cols-12 gap-4 items-start border-b pb-4">
                <div className="col-span-3">
                  <p className="font-medium text-sm">{c.name}</p>
                  <p className="text-xs text-muted-foreground">Poids: {c.weight}%</p>
                </div>
                <div className="col-span-3 space-y-2">
                  <label className="text-xs font-medium">Note (sur {c.max_score})</label>
                  <input 
                    type="number" 
                    required 
                    min="0" 
                    max={c.max_score}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={scores[c.id_criteria]?.score || ''}
                    onChange={(e) => setScores({
                      ...scores,
                      [c.id_criteria]: { ...scores[c.id_criteria], score: Number(e.target.value) }
                    })}
                  />
                </div>
                <div className="col-span-6 space-y-2">
                  <label className="text-xs font-medium">Commentaire / Justification</label>
                  <input 
                    type="text" 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Facultatif..."
                    value={scores[c.id_criteria]?.comment || ''}
                    onChange={(e) => setScores({
                      ...scores,
                      [c.id_criteria]: { ...scores[c.id_criteria], comment: e.target.value }
                    })}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Bilan et Décision Finale</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Commentaire Général du Manager</label>
              <textarea 
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.general_cmt}
                onChange={(e) => setFormData({ ...formData, general_cmt: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Décision Globale</label>
              <select 
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.decision}
                onChange={(e) => setFormData({ ...formData, decision: e.target.value })}
              >
                <option value="Excellent">Excellent</option>
                <option value="Bon">Bon</option>
                <option value="Moyen">Moyen</option>
                <option value="Faible">Faible</option>
              </select>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2 bg-muted/50 py-4">
            <Button type="button" variant="outline" onClick={() => navigate('/dashboard/evaluations')}>Annuler</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Sauvegarde...' : 'Enregistrer l\'évaluation'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
