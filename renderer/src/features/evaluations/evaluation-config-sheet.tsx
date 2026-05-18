import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { toast } from 'sonner'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '../../components/ui/sheet'
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from '../../components/ui/tabs'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import {
    Plus,
    Trash2,
    Calendar,
    Target,
    Loader2,
    Info
} from 'lucide-react'
import { Separator } from '../../components/ui/separator'

interface EvaluationConfigSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EvaluationConfigSheet({ open, onOpenChange }: EvaluationConfigSheetProps) {
    const queryClient = useQueryClient()
    const [newCampaign, setNewCampaign] = React.useState({ title: '', type: 'Annual', date_start: '', date_end: '' })
    const [newCriteria, setNewCriteria] = React.useState({ name: '', weight: 1, max_score: 100 })

    // Data Fetching
    const { data: campaigns = [], isLoading: isLoadingCampaigns } = useQuery({
        queryKey: ['campaigns'],
        queryFn: async () => (await api.get('/api/evaluations/campaigns')).data.data
    })

    const { data: criteria = [], isLoading: isLoadingCriteria } = useQuery({
        queryKey: ['criteria'],
        queryFn: async () => (await api.get('/api/evaluations/criteria')).data.data
    })

    // Mutations
    const createCampaign = useMutation({
        mutationFn: (data: typeof newCampaign) => api.post('/api/evaluations/campaigns', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['campaigns'] })
            toast.success('Campaign created')
            setNewCampaign({ title: '', type: 'Annual', date_start: '', date_end: '' })
        },
        onError: () => toast.error('Failed to create campaign')
    })

    const createCriteria = useMutation({
        mutationFn: (data: typeof newCriteria) => api.post('/api/evaluations/criteria', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['criteria'] })
            toast.success('Criterion created')
            setNewCriteria({ name: '', weight: 1, max_score: 100 })
        },
        onError: () => toast.error('Failed to create criterion')
    })

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-md w-full overflow-y-auto">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        Evaluation Framework
                    </SheetTitle>
                    <SheetDescription>
                        Configure campaigns and define weighted performance metrics.
                    </SheetDescription>
                </SheetHeader>

                <Tabs defaultValue="campaigns" className="mt-8 space-y-6">
                    <TabsList className="grid w-full grid-cols-2 bg-muted/50">
                        <TabsTrigger value="campaigns" className="gap-2">
                            <Calendar className="h-4 w-4" />
                            Campaigns
                        </TabsTrigger>
                        <TabsTrigger value="criteria" className="gap-2">
                            <Target className="h-4 w-4" />
                            Criteria
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="campaigns" className="space-y-6 animate-in fade-in duration-300">
                        <div className="space-y-4 p-4 bg-muted/30 rounded-xl border border-primary/5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary/70 mb-2">New Assessment Cycle</p>
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <Label htmlFor="title" className="text-xs">Campaign Title</Label>
                                    <Input id="title" placeholder="e.g. Annual Review 2024" value={newCampaign.title} onChange={e => setNewCampaign({ ...newCampaign, title: e.target.value })} className="h-9" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs">Start Date</Label>
                                        <Input type="date" value={newCampaign.date_start} onChange={e => setNewCampaign({ ...newCampaign, date_start: e.target.value })} className="h-9" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">End Date</Label>
                                        <Input type="date" value={newCampaign.date_end} onChange={e => setNewCampaign({ ...newCampaign, date_end: e.target.value })} className="h-9" />
                                    </div>
                                </div>
                                <Button
                                    className="w-full mt-2 h-9 shadow-lg shadow-primary/10"
                                    onClick={() => createCampaign.mutate(newCampaign)}
                                    disabled={!newCampaign.title || !newCampaign.date_start || createCampaign.isPending}
                                >
                                    {createCampaign.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                                    Register Campaign
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-50 px-2">Cycle History</p>
                            <Separator />
                            {isLoadingCampaigns ? (
                                <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin opacity-20" /></div>
                            ) : (
                                <div className="space-y-2">
                                    {campaigns.map((c: any) => (
                                        <div key={c.id_campaign} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:border-primary/20 transition-all group">
                                            <div>
                                                <p className="text-sm font-bold">{c.title}</p>
                                                <p className="text-[10px] text-muted-foreground italic">
                                                    {new Date(c.date_start).toLocaleDateString()} — {new Date(c.date_end).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    {campaigns.length === 0 && <p className="text-center py-8 text-xs text-muted-foreground italic border-2 border-dashed rounded-xl">No campaigns defined.</p>}
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="criteria" className="space-y-6 animate-in fade-in duration-300">
                        <div className="space-y-4 p-4 bg-muted/30 rounded-xl border border-primary/5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary/70 mb-2">Define Performance Matrix</p>
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <Label className="text-xs">Criterion Name</Label>
                                    <Input placeholder="e.g. Technical Mastery" value={newCriteria.name} onChange={e => setNewCriteria({ ...newCriteria, name: e.target.value })} className="h-9" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs">Weight (Multiplier)</Label>
                                        <Input type="number" value={newCriteria.weight} onChange={e => setNewCriteria({ ...newCriteria, weight: Number(e.target.value) })} className="h-9" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Max Score</Label>
                                        <Input type="number" value={newCriteria.max_score} onChange={e => setNewCriteria({ ...newCriteria, max_score: Number(e.target.value) })} className="h-9" />
                                    </div>
                                </div>
                                <Button
                                    className="w-full mt-2 h-9 shadow-lg shadow-primary/10"
                                    onClick={() => createCriteria.mutate(newCriteria)}
                                    disabled={!newCriteria.name || createCriteria.isPending}
                                >
                                    {createCriteria.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                                    Deploy Scale
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-50 px-2 flex items-center justify-between">
                                Active Metrics
                                <span className="font-normal opacity-50 hover:opacity-100 cursor-help"><Info className="h-3 w-3" /></span>
                            </p>
                            <Separator />
                            {isLoadingCriteria ? (
                                <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin opacity-20" /></div>
                            ) : (
                                <div className="space-y-2">
                                    {criteria.map((cr: any) => (
                                        <div key={cr.id_criteria} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:border-primary/20 transition-all group">
                                            <div>
                                                <p className="text-sm font-bold">{cr.name}</p>
                                                <div className="flex gap-2 mt-1">
                                                    <span className="text-[9px] font-black uppercase bg-muted px-1.5 py-0.5 rounded">Wt: {cr.weight}x</span>
                                                    <span className="text-[9px] font-black uppercase bg-muted px-1.5 py-0.5 rounded">Max: {cr.max_score}</span>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    {criteria.length === 0 && <p className="text-center py-8 text-xs text-muted-foreground italic border-2 border-dashed rounded-xl">No metrics defined.</p>}
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </SheetContent>
        </Sheet>
    )
}
