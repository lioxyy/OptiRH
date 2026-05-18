import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import { toast } from 'sonner'

interface InterviewResultFormProps {
    interviewId: number
    candidateName: string
    onClose: () => void
}

export function InterviewResultForm({ interviewId, candidateName, onClose }: InterviewResultFormProps) {
    const queryClient = useQueryClient()
    const [score, setScore] = useState<number>(0)
    const [notes, setNotes] = useState('')
    const [error, setError] = useState<string | null>(null)

    const mutation = useMutation({
        mutationFn: async () => {
            await api.patch(`/api/recruitment/interviews/${interviewId}/result`, {
                score: Number(score),
                notes,
            })
        },
        onSuccess: () => {
            toast.success('Interview result submitted')
            queryClient.invalidateQueries({ queryKey: ['recruitment'] })
            onClose()
        },
        onError: (err: any) => {
            setError(err.response?.data?.message || 'Failed to submit result')
        },
    })

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Interview Result: {candidateName}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {error && (
                        <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md font-medium">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Score (0-100)</label>
                        <Input
                            type="number"
                            min={0}
                            max={100}
                            value={score}
                            onChange={(e) => setScore(Number(e.target.value))}
                            placeholder="e.g. 85"
                            className="bg-background"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Interview Notes</label>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Summary of the candidate performance..."
                            rows={4}
                            className="bg-background"
                        />
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                        <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => mutation.mutate()}
                            disabled={mutation.isPending || score < 0 || score > 100}
                        >
                            {mutation.isPending ? 'Submitting...' : 'Submit Result'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
