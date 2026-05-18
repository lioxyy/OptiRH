import { Printer, User, Award, ShieldCheck } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Separator } from '../../components/ui/separator'

interface EvaluationReportProps {
    evaluation: any
    onBack: () => void
}

export function EvaluationReport({ evaluation, onBack }: EvaluationReportProps) {
    const handlePrint = () => {
        window.print()
    }

    const dateStr = new Date(evaluation.date_eval).toLocaleDateString()
    const scoreColor = evaluation.score >= 80 ? 'text-green-600' : evaluation.score >= 50 ? 'text-yellow-600' : 'text-destructive'

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-10">
            {/* ACTION BAR */}
            <div className="flex items-center justify-between print:hidden mb-6 bg-muted/30 p-4 rounded-xl border border-primary/5">
                <div>
                    <h2 className="text-xl font-bold tracking-tight">Performance Report</h2>
                    <p className="text-xs text-muted-foreground italic">Official record of assessment for the {evaluation.campaign?.title || 'General'} period.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={onBack}>Return to List</Button>
                    <Button size="sm" onClick={handlePrint} className="gap-2 shadow-lg shadow-primary/20">
                        <Printer className="h-4 w-4" />
                        Print Official PDF
                    </Button>
                </div>
            </div>

            <div id="printable-report" className="print:m-0 print:p-0">
                <Card className="border-2 border-primary/20 print:border-black print:shadow-none bg-white text-slate-900">
                    <CardContent className="p-10 space-y-10">
                        {/* OFFICIAL HEADER */}
                        <div className="flex justify-between items-start border-b-2 border-primary/20 pb-8">
                            <div className="space-y-1">
                                <h1 className="text-4xl font-black tracking-tighter text-primary print:text-black">OptiRH</h1>
                                <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-60">Human Capital Management</p>
                            </div>
                            <div className="text-right space-y-1">
                                <h2 className="text-lg font-black uppercase text-slate-800 print:text-black">Professional Assessment Report</h2>
                                <p className="text-[10px] opacity-70">Document Ref: EVL-{evaluation.id_eval}-{new Date().getFullYear()}</p>
                            </div>
                        </div>

                        {/* SUBJECT INFO */}
                        <div className="grid grid-cols-2 gap-12">
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-primary/70 print:text-black border-b pb-1">Person under Review</h3>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <User className="h-4 w-4 opacity-40" />
                                        <span className="font-bold text-lg">{evaluation.evaluatee_emp?.name || evaluation.evaluatee_cand?.name}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground ml-7 font-medium italic">
                                        {evaluation.type_eval === 'Employee' ? 'Active Personnel' : 'Recruitment Candidate'}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-primary/70 print:text-black border-b pb-1">Review Context</h3>
                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between">
                                        <span className="font-semibold opacity-60">Campaign:</span>
                                        <span className="font-bold">{evaluation.campaign?.title || 'Unscheduled'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-semibold opacity-60">Date of Review:</span>
                                        <span className="font-bold">{dateStr}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-semibold opacity-60">Executive Lead:</span>
                                        <span className="font-bold">{evaluation.evaluator?.name}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SCORE HERO */}
                        <div className="flex gap-8">
                            <div className="flex-1 bg-slate-50 print:bg-white border-2 border-primary/10 print:border-black p-8 rounded-2xl text-center space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Aggregate Performance Score</p>
                                <div className={`text-6xl font-black ${scoreColor} print:text-black tracking-tighter`}>
                                    {evaluation.score}<span className="text-2xl opacity-40">/100</span>
                                </div>
                            </div>
                            <div className="flex-1 flex flex-col justify-center border-2 border-primary/10 print:border-black p-8 rounded-2xl text-center space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Decision Status</p>
                                <div className="text-3xl font-black text-slate-800 print:text-black uppercase">
                                    {evaluation.score >= 80 ? 'Distinction' : evaluation.score >= 60 ? 'Satisfactory' : 'Needs Review'}
                                </div>
                            </div>
                        </div>

                        <Separator className="bg-primary/10" />

                        {/* CRITERIA BREAKDOWN */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                <Award className="h-4 w-4 text-primary" />
                                Granular Skill Metrics
                            </h3>
                            <div className="border border-primary/10 print:border-black rounded-xl overflow-hidden">
                                <table className="w-full text-xs">
                                    <thead className="bg-slate-50 print:bg-white border-b">
                                        <tr>
                                            <th className="p-4 text-left font-bold uppercase opacity-60">Performance Dimension</th>
                                            <th className="p-4 text-left font-bold uppercase opacity-60">Executive Observations</th>
                                            <th className="p-4 text-center font-bold uppercase opacity-60 w-32">Rating</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {evaluation.scores?.map((s: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="p-4 font-bold text-slate-800">
                                                    {s.criteria.name}
                                                    <p className="text-[9px] font-normal opacity-50 italic">Weight: {s.criteria.weight}x</p>
                                                </td>
                                                <td className="p-4 text-slate-600 italic">
                                                    {s.comment || 'Performance as expected.'}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className="font-black text-lg">{s.score}</span>
                                                    <span className="opacity-40 font-bold"> / {s.criteria.max_score}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* GENERAL COMMENTS */}
                        {evaluation.comments && (
                            <div className="space-y-4">
                                <h3 className="text-sm font-black uppercase tracking-widest">Executive Summary</h3>
                                <div className="p-6 bg-slate-50 print:bg-white border-l-4 border-primary rounded-r-xl text-sm italic text-slate-700 leading-relaxed">
                                    "{evaluation.comments}"
                                </div>
                            </div>
                        )}

                        {/* MERIT BONUS */}
                        {evaluation.bonus_amount > 0 && (
                            <div className="flex items-center gap-4 p-4 bg-green-50/50 print:bg-white border border-green-500/20 rounded-xl">
                                <ShieldCheck className="h-6 w-6 text-green-600" />
                                <div>
                                    <p className="text-xs font-bold text-green-800 uppercase tracking-wider">Approved Performance Merit</p>
                                    <p className="text-lg font-black text-green-900">{evaluation.bonus_amount} DA <span className="text-[10px] font-normal opacity-70">(Assessed for next payroll cycle)</span></p>
                                </div>
                            </div>
                        )}

                        {/* SIGNATURES */}
                        <div className="grid grid-cols-2 gap-16 pt-10 mt-10">
                            <div className="space-y-12">
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 border-b pb-2">Assessing Lead Signature</p>
                                <div className="flex flex-col gap-1">
                                    <div className="border-b-2 border-slate-300 border-dashed w-full h-8 px-4 font-mono text-[10px] italic flex items-end">
                                        Authenticated: {evaluation.evaluator?.name}
                                    </div>
                                    <p className="text-[9px] opacity-40">Date Signed: ____ / ____ / ________</p>
                                </div>
                            </div>
                            <div className="space-y-12">
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 border-b pb-2">Individual Acknowledgment</p>
                                <div className="flex flex-col gap-1">
                                    <div className="border-b-2 border-slate-300 border-dashed w-full h-8"></div>
                                    <p className="text-[9px] opacity-40">Date Signed: ____ / ____ / ________</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-report, #printable-report * {
            visibility: visible;
          }
          #printable-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          header, footer, nav, .print-hidden {
             display: none !important;
          }
        }
      `}</style>
        </div>
    )
}
