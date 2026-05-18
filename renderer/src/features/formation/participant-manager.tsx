import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '../../components/ui/dialog'
import { Avatar, AvatarFallback } from '../../components/ui/avatar'
import { ScrollArea } from '../../components/ui/scroll-area'
import { toast } from 'sonner'
import {
    Users,
    Search,
    UserPlus,
    UserMinus,
    Loader2,
    GraduationCap
} from 'lucide-react'

interface ParticipantManagerProps {
    formation: any
    onClose: () => void
}

export function ParticipantManager({ formation, onClose }: ParticipantManagerProps) {
    const queryClient = useQueryClient()
    const [search, setSearch] = useState('')

    const { data: participants = [], isLoading: loadingParticipants } = useQuery({
        queryKey: ['formations', formation.id_formation, 'participants'],
        queryFn: async () => {
            const res = await api.get(`/api/formations/${formation.id_formation}/participants`)
            return res.data.data
        },
    })

    const { data: allEmployees = [] } = useQuery({
        queryKey: ['employees'],
        queryFn: async () => {
            const res = await api.get('/api/employees')
            return res.data.data
        },
    })

    const addMutation = useMutation({
        mutationFn: async (empId: number) => {
            await api.post(`/api/formations/${formation.id_formation}/participants`, { emp_id: empId })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['formations', formation.id_formation, 'participants'] })
            toast.success('Participant added')
        },
    })

    const removeMutation = useMutation({
        mutationFn: async (empId: number) => {
            await api.delete(`/api/formations/${formation.id_formation}/participants/${empId}`)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['formations', formation.id_formation, 'participants'] })
            toast.success('Participant removed')
        },
    })

    const filteredEmployees = allEmployees.filter((emp: any) => {
        const isAlreadyParticipant = participants.some((p: any) => p.id_emp === emp.id_emp)
        const matchesSearch = emp.name.toLowerCase().includes(search.toLowerCase()) ||
            emp.email.toLowerCase().includes(search.toLowerCase())
        return !isAlreadyParticipant && matchesSearch && emp.id_emp !== formation.id_instructor
    })

    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase()

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] gap-0 p-0">
                <DialogHeader className="p-6 border-b">
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Manage Participants
                    </DialogTitle>
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <GraduationCap className="h-4 w-4" />
                        {formation.name}
                    </div>
                </DialogHeader>

                <div className="flex h-[450px]">
                    {/* List of Enrolled */}
                    <div className="flex-1 flex flex-col border-r">
                        <div className="p-4 bg-muted/30 border-b">
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Enrolled ({participants.length})
                            </span>
                        </div>
                        <ScrollArea className="flex-1">
                            {loadingParticipants ? (
                                <div className="p-8 flex justify-center"><Loader2 className="animate-spin h-6 w-6 text-muted-foreground" /></div>
                            ) : participants.length === 0 ? (
                                <div className="p-8 text-center text-sm text-muted-foreground italic">No participants enrolled yet.</div>
                            ) : (
                                <div className="divide-y">
                                    {participants.map((p: any) => (
                                        <div key={p.id_emp} className="p-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback className="text-[10px]">{getInitials(p.name)}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium leading-none">{p.name}</span>
                                                    <span className="text-[10px] text-muted-foreground">{p.role}</span>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                                onClick={() => removeMutation.mutate(p.id_emp)}
                                                disabled={removeMutation.isPending}
                                            >
                                                <UserMinus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>

                    {/* Add New */}
                    <div className="flex-1 flex flex-col">
                        <div className="p-4 bg-muted/30 border-b space-y-3">
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                                Add Employees
                            </span>
                            <div className="relative">
                                <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                    placeholder="Search..."
                                    className="h-8 pl-8 text-xs"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        <ScrollArea className="flex-1">
                            <div className="divide-y">
                                {filteredEmployees.map((emp: any) => (
                                    <div key={emp.id_emp} className="p-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{getInitials(emp.name)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium leading-none">{emp.name}</span>
                                                <span className="text-[10px] text-muted-foreground">{emp.role}</span>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-primary hover:bg-primary/10"
                                            onClick={() => addMutation.mutate(emp.id_emp)}
                                            disabled={addMutation.isPending}
                                        >
                                            <UserPlus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
