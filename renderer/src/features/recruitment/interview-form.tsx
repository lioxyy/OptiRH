import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { toast } from 'sonner'

interface InterviewFormProps {
    candidateId: number
    candidateName: string
    onClose: () => void
}

interface Employee {
    id_emp: number
    name: string
    role: string
}

export function InterviewForm({ candidateId, candidateName, onClose }: InterviewFormProps) {
    const queryClient = useQueryClient()
    const [dateHeure, setDateHeure] = useState('')
    const [idAgent, setIdAgent] = useState<string>('')
    const [error, setError] = useState<string | null>(null)

    const { data: employees = [] } = useQuery<Employee[]>({
        queryKey: ['employees'],
        queryFn: async () => {
            const res = await api.get('/api/employees')
            return res.data.data
        },
    })

    // Filter for potential interviewers (Admins and Agents)
    const interviewers = employees.filter(e => e.role === 'Admin' || e.role === 'Agent')

    const mutation = useMutation({
        mutationFn: async () => {
            await api.post('/api/recruitment/interviews', {
                id_cand: candidateId,
                date_heure: new Date(dateHeure).toISOString(),
                id_agent: Number(idAgent),
            })
        },
        onSuccess: () => {
            toast.success('Interview scheduled successfully')
            queryClient.invalidateQueries({ queryKey: ['recruitment'] })
            onClose()
        },
        onError: (err: any) => {
            setError(err.response?.data?.message || 'Failed to schedule interview')
        },
    })

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Schedule Interview for {candidateName}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {error && (
                        <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md font-medium">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Date & Time</label>
                        <Input
                            type="datetime-local"
                            value={dateHeure}
                            onChange={(e) => setDateHeure(e.target.value)}
                            className="bg-background"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Interviewer (Agent/Admin)</label>
                        <Select onValueChange={setIdAgent} value={idAgent}>
                            <SelectTrigger className="bg-background">
                                <SelectValue placeholder="Select interviewer..." />
                            </SelectTrigger>
                            <SelectContent>
                                {interviewers.map((emp) => (
                                    <SelectItem key={emp.id_emp} value={emp.id_emp.toString()}>
                                        {emp.name} ({emp.role})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                        <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => mutation.mutate()}
                            disabled={mutation.isPending || !dateHeure || !idAgent}
                        >
                            {mutation.isPending ? 'Scheduling...' : 'Schedule'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
