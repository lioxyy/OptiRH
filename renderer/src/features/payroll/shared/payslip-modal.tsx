import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'
import { ReceiptText, Printer, Landmark } from 'lucide-react'

export interface PayrollRecord {
    id_salaire: number
    month_year: string
    bonus_amount: number
    absence_deductions: number
    amount_final: number
    status: 'Generated' | 'Validated' | 'Paid'
    id_emp: number
    id_contract: number
    employee: {
        name: string
        email: string
        role: string
        departments?: { name: string }[]
        department?: { name: string } // Support both structures
    }
    contract: {
        type?: string
        type_contrat?: string
        salaire_base: number
    }
}

interface PayslipModalProps {
    record: PayrollRecord
    open: boolean
    onClose: () => void
}

export function PayslipModal({ record, open, onClose }: PayslipModalProps) {
    // Logic to handle pro-rating vs bonuses vs deductions
    // Base = record.contract.salaire_base
    // Final = proRatedBase + bonus - absences - massrouf
    // We don't store proRatedBase, so we assume it from the record if possible, 
    // or use the contract base as a fallback.

    const contractBase = record.contract?.salaire_base ?? 0
    const bonus = record.bonus_amount ?? 0
    const absences = record.absence_deductions ?? 0
    const final = record.amount_final ?? 0

    // Reconstruction of deductions
    // Total Retenues should be positive for display
    const totalRetenues = absences + Math.max(0, contractBase + bonus - absences - final)
    const massroufDeduction = Math.max(0, totalRetenues - absences)

    // Total Brut = adjusted base + bonus
    // Since we don't store adjusted base, we show contract base + bonus
    // BUT if Final + Retenues < ContractBase + Bonus, it means there was pro-rating.
    const brutTotal = Math.max(final + totalRetenues, contractBase + bonus)

    const handlePrint = () => {
        window.print()
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl border-none bg-background text-foreground shadow-2xl rounded-xl overflow-y-auto max-h-[92vh]">
                <DialogHeader className="no-print pb-2">
                    <DialogTitle className="text-lg font-bold flex items-center gap-2">
                        <ReceiptText className="h-5 w-5 text-muted-foreground" />
                        Bulletin de Paie — {record.month_year}
                    </DialogTitle>
                    <DialogDescription>Official payslip for period {record.month_year}</DialogDescription>
                </DialogHeader>

                {/* ── Printable Payslip ── */}
                <div id="printable-payslip" className="p-6 bg-white text-black font-sans rounded-xl border border-gray-200 space-y-5">
                    {/* Header */}
                    <div className="flex justify-between items-start border-b-2 border-gray-900 pb-4">
                        <div className="space-y-0.5">
                            <h2 className="text-xl font-black tracking-tight text-gray-900 uppercase">OptiRH Enterprise</h2>
                            <p className="text-[10px] text-gray-500 font-mono">16, Rue des Pinèdes, Alger, Algérie</p>
                            <p className="text-[10px] text-gray-500 font-mono">NIF: 001923485693425 • RC: 16/00-3498B26</p>
                        </div>
                        <div className="text-right bg-gray-100 p-2.5 rounded-lg border border-gray-200 space-y-0.5">
                            <span className="text-[9px] uppercase tracking-widest font-extrabold text-gray-500 block">BULLETIN DE PAIE</span>
                            <span className="text-sm font-bold text-gray-800 font-mono block">Période : {record.month_year}</span>
                            <span className="text-[10px] text-gray-500 font-mono block">Réf. #{record.id_salaire.toString().padStart(5, '0')}</span>
                        </div>
                    </div>

                    {/* Employee & Payment Info */}
                    <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-1">
                            <span className="text-[9px] uppercase tracking-wider font-extrabold text-gray-400 block">Informations Salarié</span>
                            <p className="font-bold text-gray-900 text-sm">{record.employee?.name}</p>
                            <p className="text-gray-600 font-medium">{record.employee?.role}</p>
                            <p className="text-gray-500">
                                {record.employee?.departments?.map(d => d.name).join(', ') || record.employee?.department?.name || 'General'}
                            </p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-1 font-mono">
                            <span className="text-[9px] uppercase tracking-wider font-extrabold text-gray-400 block">Informations Paiement</span>
                            <p className="text-gray-700 text-[11px] font-semibold flex items-center gap-1">
                                <Landmark className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                Virement Bancaire
                            </p>
                            <p className="text-gray-500 text-[10px]">Contrat : {record.contract?.type || record.contract?.type_contrat} — Base : {contractBase.toLocaleString()} DZD</p>
                            <p className="text-gray-500 text-[10px]">Statut Paie : {record.status}</p>
                        </div>
                    </div>

                    {/* Salary Breakdown Table */}
                    <table className="w-full text-xs border-collapse border border-gray-200">
                        <thead>
                            <tr className="bg-gray-100 border-b border-gray-300">
                                <th className="py-2.5 px-3 text-left font-extrabold text-gray-700 uppercase tracking-wider">Désignation</th>
                                <th className="py-2.5 px-3 text-right font-extrabold text-gray-700 uppercase tracking-wider">Gains (DZD)</th>
                                <th className="py-2.5 px-3 text-right font-extrabold text-gray-700 uppercase tracking-wider">Retenues (DZD)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {/* Earnings: Contract base */}
                            <tr className="bg-emerald-50/5">
                                <td className="py-2.5 px-3 font-semibold text-gray-800">Salaire de Base (Contractuel)</td>
                                <td className="py-2.5 px-3 text-right font-bold font-mono text-gray-900">+ {contractBase.toLocaleString()}</td>
                                <td className="py-2.5 px-3 text-right font-mono text-gray-300">—</td>
                            </tr>
                            {/* Earnings: Evaluation Bonus */}
                            {bonus > 0 && (
                                <tr className="bg-emerald-50/20">
                                    <td className="py-2.5 px-3 text-emerald-900 font-medium flex items-center gap-1.5">
                                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                                        Prime / Bonus (Évaluations)
                                    </td>
                                    <td className="py-2.5 px-3 text-right font-bold font-mono text-emerald-600">+ {bonus.toLocaleString()}</td>
                                    <td className="py-2.5 px-3 text-right font-mono text-gray-300">—</td>
                                </tr>
                            )}
                            {/* Deductions: Absences */}
                            {absences > 0.01 && (
                                <tr className="bg-red-50/20">
                                    <td className="py-2.5 px-3 text-red-900 font-medium flex items-center gap-1.5">
                                        <div className="h-1.5 w-1.5 rounded-full bg-red-500"></div>
                                        Retenue — Absences Non Justifiées
                                    </td>
                                    <td className="py-2.5 px-3 text-right font-mono text-gray-300">—</td>
                                    <td className="py-2.5 px-3 text-right font-bold font-mono text-red-600">- {absences.toLocaleString()}</td>
                                </tr>
                            )}
                            {/* Deductions: Massrouf */}
                            {massroufDeduction > 0.01 && (
                                <tr className="bg-orange-50/20">
                                    <td className="py-2.5 px-3 text-orange-900 font-medium flex items-center gap-1.5">
                                        <div className="h-1.5 w-1.5 rounded-full bg-orange-500"></div>
                                        Remboursement Avance (Massrouf)
                                    </td>
                                    <td className="py-2.5 px-3 text-right font-mono text-gray-300">—</td>
                                    <td className="py-2.5 px-3 text-right font-bold font-mono text-orange-600">- {massroufDeduction.toLocaleString()}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Totals */}
                    <div className="flex justify-end pt-2">
                        <div className="w-72 space-y-2 text-xs">
                            <div className="flex justify-between font-mono text-gray-600 px-1">
                                <span>Total Brut :</span>
                                <span className="font-bold">+ {brutTotal.toLocaleString()} DZD</span>
                            </div>
                            {totalRetenues > 0 && (
                                <div className="flex justify-between font-mono text-red-600 px-1">
                                    <span>Total Retenues :</span>
                                    <span className="font-bold">- {totalRetenues.toLocaleString()} DZD</span>
                                </div>
                            )}
                            <div className="flex justify-between font-bold text-sm bg-gray-900 border border-gray-950 text-white p-3 rounded-lg shadow-sm">
                                <span className="uppercase tracking-wider font-black">Net à Payer :</span>
                                <span className="font-mono text-base font-black">{final.toLocaleString()} DZD</span>
                            </div>
                        </div>
                    </div>

                    {/* Signatures */}
                    <div className="grid grid-cols-2 gap-6 pt-10 border-t border-gray-100 text-[10px] text-gray-500 font-semibold">
                        <div className="text-center space-y-12">
                            <span>SIGNATURE DE L'EMPLOYEUR</span>
                            <div className="border-t border-gray-300 pt-1 text-gray-400 font-normal italic">[Cachet OptiRH]</div>
                        </div>
                        <div className="text-center space-y-12">
                            <span>SIGNATURE DU SALARIÉ</span>
                            <div className="border-t border-gray-300 pt-1 text-gray-400 font-normal italic">[Lu et approuvé]</div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="no-print pt-4 border-t border-border/10 gap-2">
                    <Button variant="ghost" className="rounded-lg h-9 text-xs" onClick={onClose}>Close</Button>
                    <Button
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg h-9 text-xs px-4 gap-1.5 shadow-sm"
                        onClick={handlePrint}
                    >
                        <Printer className="h-3.5 w-3.5" />
                        Print / Export PDF
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
