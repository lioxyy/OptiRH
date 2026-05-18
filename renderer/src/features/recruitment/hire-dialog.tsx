import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { EmployeeForm } from '../employees/employee-form'
import { X } from 'lucide-react'

interface HireDialogProps {
    candidate: {
        id_cand: number
        name: string
        email: string
        post_applied?: string | null
    }
    onClose: () => void
    onSuccess: () => void
}

export function HireDialog({ candidate, onClose, onSuccess }: HireDialogProps) {
    // Pre-fill employee data from candidate
    const initialData = {
        name: candidate.name,
        email: candidate.email,
        role: 'Employee' as const,
        // We don't have these in the candidate model usually, so they'll be blank
        date_birth: '',
        gender: 'MALE',
        date_employment: new Date().toISOString().split('T')[0],
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle className="text-xl font-bold">Hire Candidate: {candidate.name}</CardTitle>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X className="h-5 w-5" />
                    </button>
                </CardHeader>
                <CardContent>
                    <div className="mb-6 p-3 bg-muted/30 rounded-lg border border-border">
                        <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Candidature Info</p>
                        <p className="text-sm font-medium">Position Applied: <span className="text-primary">{candidate.post_applied || 'Not specified'}</span></p>
                    </div>

                    <EmployeeForm
                        initialData={initialData}
                        onSuccess={() => {
                            onSuccess()
                            onClose()
                        }}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
