import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { PrinterIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getEmployeeEvals } from './api'
import { format } from 'date-fns'

export function EvaluationReport() {
  const { id } = useParams()
  const { data: evals, isLoading } = useQuery({
    queryKey: ['evals', id],
    queryFn: () => getEmployeeEvals(Number(id)),
  })

  if (isLoading) return <div>Chargement du rapport...</div>
  if (!evals || evals.length === 0) return <div>Aucune évaluation trouvée pour cet employé.</div>

  const evaluation = evals[0] // Prendre la plus récente

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between print:hidden mb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Rapport d'Évaluation</h2>
          <p className="text-muted-foreground">Consultez et imprimez ce rapport détaillé.</p>
        </div>
        <Button onClick={handlePrint} size="lg">
          <PrinterIcon className="mr-2 h-5 w-5" />
          Imprimer le Rapport Officiel
        </Button>
      </div>

      <div className="print-area bg-white text-black p-8 rounded-lg border border-black print:border-none print:p-0">
        {/* En-tête Officiel */}
        <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-8">
          <div>
            <h1 className="text-3xl font-black text-black tracking-tight">OptiRH</h1>
            <p className="text-sm font-medium text-black uppercase tracking-widest mt-1">Ressources Humaines</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold uppercase text-black">Rapport d'Évaluation des Performances</h2>
            <p className="text-sm text-black mt-1">Généré le {format(new Date(), 'dd/MM/yyyy')}</p>
          </div>
        </div>

        {/* Informations Employé & Campagne */}
        <div className="grid grid-cols-2 gap-8 mb-8 text-black">
          <div className="p-5 rounded-md border border-black">
            <h3 className="font-bold text-sm uppercase text-black mb-4 border-b border-black pb-2">Informations de l'Employé</h3>
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-3"><span className="font-semibold">Nom complet:</span> <span className="col-span-2 font-medium">{evaluation.employee?.name}</span></div>
              <div className="grid grid-cols-3"><span className="font-semibold">Email:</span> <span className="col-span-2">{evaluation.employee?.email}</span></div>
              <div className="grid grid-cols-3"><span className="font-semibold">Poste:</span> <span className="col-span-2">{evaluation.employee?.role}</span></div>
              <div className="grid grid-cols-3"><span className="font-semibold">Département:</span> <span className="col-span-2">{evaluation.employee?.department?.name || 'N/A'}</span></div>
              <div className="grid grid-cols-3"><span className="font-semibold">Embauche:</span> <span className="col-span-2">{evaluation.employee?.date_employment ? format(new Date(evaluation.employee.date_employment), 'dd/MM/yyyy') : 'N/A'}</span></div>
            </div>
          </div>
          
          <div className="p-5 rounded-md border border-black">
            <h3 className="font-bold text-sm uppercase text-black mb-4 border-b border-black pb-2">Détails de l'Évaluation</h3>
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-3"><span className="font-semibold">Campagne:</span> <span className="col-span-2 font-medium">{evaluation.campaign.title}</span></div>
              <div className="grid grid-cols-3"><span className="font-semibold">Date d'éval:</span> <span className="col-span-2">{format(new Date(evaluation.date_eval), 'dd/MM/yyyy')}</span></div>
              <div className="grid grid-cols-3"><span className="font-semibold">Évaluateur:</span> <span className="col-span-2">{evaluation.evaluator.name}</span></div>
              <div className="grid grid-cols-3"><span className="font-semibold">Statut:</span> <span className="col-span-2">Finalisée</span></div>
            </div>
          </div>
        </div>

        {/* Note et Décision Globale */}
        <div className="flex gap-6 mb-8 text-black">
          <div className="flex-1 border border-black p-6 rounded-md text-center">
            <p className="text-sm font-semibold uppercase tracking-wider mb-2">Note Globale Obtenue</p>
            <p className="text-5xl font-black">{evaluation.final_score.toFixed(2)}<span className="text-2xl">/100</span></p>
          </div>
          <div className="flex-1 border border-black p-6 rounded-md text-center flex flex-col justify-center">
            <p className="text-sm font-semibold uppercase tracking-wider mb-2">Appréciation Finale</p>
            <p className="text-3xl font-bold">{evaluation.decision}</p>
          </div>
        </div>

        {/* Détail par Critère */}
        <div className="mb-8 text-black">
          <h3 className="font-bold text-lg border-b-2 border-black pb-2 mb-4">Détail des Compétences Évaluées</h3>
          <table className="w-full text-sm border-collapse border border-black">
            <thead>
              <tr>
                <th className="border border-black p-3 text-left font-semibold">Critère d'Évaluation</th>
                <th className="border border-black p-3 text-left font-semibold">Commentaire du Manager</th>
                <th className="border border-black p-3 text-center font-semibold w-32">Note Attribuée</th>
              </tr>
            </thead>
            <tbody>
              {evaluation.scores.map((s: any, idx: number) => (
                <tr key={idx}>
                  <td className="border border-black p-3 font-medium">{s.criteria.name}</td>
                  <td className="border border-black p-3 italic">{s.comment || 'Aucun commentaire spécifique.'}</td>
                  <td className="border border-black p-3 text-center font-bold">
                    {s.score} / {s.criteria.max_score}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Commentaire Général */}
        {evaluation.general_cmt && (
          <div className="mb-12 text-black">
            <h3 className="font-bold text-lg border-b-2 border-black pb-2 mb-4">Commentaire Général de la Direction</h3>
            <div className="border border-black p-5 rounded-md italic">
              "{evaluation.general_cmt}"
            </div>
          </div>
        )}

        {/* Section Signatures */}
        <div className="mt-16 pt-8 grid grid-cols-2 gap-12 text-black">
          <div>
            <p className="font-bold text-sm uppercase mb-12">Signature du Manager / Évaluateur</p>
            <div className="border-b-2 border-black border-dashed"></div>
            <p className="text-xs mt-2">Lu et approuvé le : ____ / ____ / ________</p>
          </div>
          <div>
            <p className="font-bold text-sm uppercase mb-12">Signature de l'Employé</p>
            <div className="border-b-2 border-black border-dashed"></div>
            <p className="text-xs mt-2">Lu et approuvé le : ____ / ____ / ________</p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            padding: 0 !important;
            color: black !important;
          }
          .print-area * {
            color: black !important;
            border-color: black !important;
          }
        }
      `}</style>
    </div>
  )
}
