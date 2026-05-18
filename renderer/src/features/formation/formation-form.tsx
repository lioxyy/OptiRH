import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { CreateFormationSchema, type CreateFormationInput } from './formation.schema'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs'
import { Checkbox } from '../../components/ui/checkbox'
import { ScrollArea } from '../../components/ui/scroll-area'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '../../components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../components/ui/select'
import { toast } from 'sonner'
import { Loader2, GraduationCap, MapPin, Calendar, User, Globe, Users, Search } from 'lucide-react'

interface FormationFormProps {
    initialData?: any
    onClose: () => void
}

export function FormationForm({ initialData, onClose }: FormationFormProps) {
    const queryClient = useQueryClient()
    const [activeTab, setActiveTab] = useState('info')
    const [searchTerm, setSearchTerm] = useState('')
    const [instructorType, setInstructorType] = useState<'local' | 'external'>(
        initialData?.external_instructor ? 'external' : 'local'
    )
    const isEditing = !!initialData

    const { register, handleSubmit, formState: { errors }, watch, setValue, trigger } = useForm<CreateFormationInput>({
        resolver: zodResolver(CreateFormationSchema),
        defaultValues: initialData ? {
            ...initialData,
            date_deb: new Date(initialData.date_deb).toISOString().split('T')[0],
            participant_ids: initialData.participations?.map((p: any) => p.id_emp) || []
        } : {
            duration_days: 1,
            participant_ids: []
        }
    })

    const { data: employees = [] } = useQuery({
        queryKey: ['employees'],
        queryFn: async () => {
            const res = await api.get('/api/employees')
            return res.data.data
        }
    })

    const selectedParticipants = watch('participant_ids') || []

    const { data: currentParticipants = [] } = useQuery({
        queryKey: ['formations', initialData?.id_formation, 'participants'],
        enabled: isEditing && !!initialData?.id_formation,
        queryFn: async () => {
            const res = await api.get(`/api/formations/${initialData.id_formation}/participants`)
            return res.data.data
        }
    })

    // Sync selected participants for editing
    useEffect(() => {
        if (isEditing && currentParticipants.length > 0 && selectedParticipants.length === 0) {
            setValue('participant_ids', currentParticipants.map((p: any) => p.id_emp))
        }
    }, [isEditing, currentParticipants, setValue])

    const mutation = useMutation({
        mutationFn: async (data: CreateFormationInput) => {
            if (isEditing) {
                return api.patch(`/api/formations/${initialData.id_formation}`, data)
            }
            return api.post('/api/formations', data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['formations'] })
            toast.success(`Formation ${isEditing ? 'updated' : 'created'} successfully`)
            onClose()
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} formation`)
        }
    })

    const handleContinue = async () => {
        if (activeTab === 'info') {
            const isValid = await trigger(['name', 'description', 'location'])
            if (isValid) setActiveTab('scheduling')
        } else if (activeTab === 'scheduling') {
            const isValid = await trigger(['date_deb', 'duration_days', 'id_instructor', 'external_instructor'])
            if (isValid) setActiveTab('participants')
        }
    }

    const onSubmit = (data: CreateFormationInput) => {
        const payload = { ...data }
        if (instructorType === 'local') {
            payload.external_instructor = undefined
        } else {
            payload.id_instructor = undefined
        }
        mutation.mutate(payload)
    }

    const filteredEmployees = employees.filter((emp: any) =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.role.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const toggleParticipant = (empId: number) => {
        const current = [...selectedParticipants]
        const index = current.indexOf(empId)
        if (index > -1) {
            current.splice(index, 1)
        } else {
            current.push(empId)
        }
        setValue('participant_ids', current)
    }

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-primary" />
                        {isEditing ? 'Edit Formation' : 'New Formation'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-3 mb-6">
                            <TabsTrigger value="info">Info</TabsTrigger>
                            <TabsTrigger value="scheduling">Details</TabsTrigger>
                            <TabsTrigger value="participants">Participants</TabsTrigger>
                        </TabsList>

                        <TabsContent value="info" className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Formation Name</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. Advanced React Architecture"
                                    {...register('name')}
                                />
                                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="location">Location</Label>
                                <div className="relative">
                                    <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="location"
                                        className="pl-9"
                                        placeholder="e.g. Conference Room A or Remote"
                                        {...register('location')}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description (Optional)</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Provide a brief overview of the training goals..."
                                    className="min-h-[100px]"
                                    {...register('description')}
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="scheduling" className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="date_deb">Start Date</Label>
                                    <div className="relative">
                                        <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="date_deb"
                                            type="date"
                                            className="pl-9"
                                            {...register('date_deb')}
                                        />
                                    </div>
                                    {errors.date_deb && <p className="text-xs text-destructive">{errors.date_deb.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="duration_days">Duration (Days)</Label>
                                    <Input
                                        id="duration_days"
                                        type="number"
                                        {...register('duration_days')}
                                    />
                                    {errors.duration_days && <p className="text-xs text-destructive">{errors.duration_days.message}</p>}
                                </div>
                            </div>

                            <div className="space-y-4 pt-2">
                                <Label>Instructor Type</Label>
                                <Tabs
                                    value={instructorType}
                                    onValueChange={(val: any) => setInstructorType(val)}
                                    className="w-full"
                                >
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="local" className="flex items-center gap-2">
                                            <User className="h-4 w-4" /> Internal
                                        </TabsTrigger>
                                        <TabsTrigger value="external" className="flex items-center gap-2">
                                            <Globe className="h-4 w-4" /> External
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="local" className="mt-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="id_instructor">Select Employee</Label>
                                            <Select
                                                value={watch('id_instructor')?.toString()}
                                                onValueChange={(val) => setValue('id_instructor', parseInt(val))}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select an instructor" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {employees.map((emp: any) => (
                                                        <SelectItem key={emp.id_emp} value={emp.id_emp.toString()}>
                                                            {emp.name} ({emp.role})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.id_instructor && <p className="text-xs text-destructive">{errors.id_instructor.message}</p>}
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="external" className="mt-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="external_instructor">Instructor Name</Label>
                                            <Input
                                                id="external_instructor"
                                                placeholder="e.g. John Doe (Partner Agency)"
                                                {...register('external_instructor')}
                                            />
                                            {errors.external_instructor && <p className="text-xs text-destructive">{errors.external_instructor.message}</p>}
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </TabsContent>

                        <TabsContent value="participants" className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium flex items-center gap-2">
                                    <Users className="h-4 w-4" /> Select Participating Employees
                                </Label>
                                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                    {selectedParticipants.length} selected
                                </span>
                            </div>

                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search employees..."
                                    className="pl-8 h-9 text-xs"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <ScrollArea className="h-[200px] border rounded-md p-1 bg-muted/20">
                                <div className="space-y-1">
                                    {filteredEmployees.map((emp: any) => (
                                        <div
                                            key={emp.id_emp}
                                            className="flex items-center space-x-2 px-2 py-1.5 hover:bg-accent/50 rounded-sm transition-colors"
                                        >
                                            <Checkbox
                                                id={`emp-${emp.id_emp}`}
                                                checked={selectedParticipants.includes(emp.id_emp)}
                                                onCheckedChange={() => toggleParticipant(emp.id_emp)}
                                            />
                                            <Label
                                                htmlFor={`emp-${emp.id_emp}`}
                                                className="flex-1 text-xs cursor-pointer"
                                            >
                                                <span className="font-medium">{emp.name}</span>
                                                <span className="ml-2 text-muted-foreground">— {emp.role}</span>
                                            </Label>
                                        </div>
                                    ))}
                                    {filteredEmployees.length === 0 && (
                                        <p className="text-center py-8 text-xs text-muted-foreground">No employees found</p>
                                    )}
                                </div>
                            </ScrollArea>
                        </TabsContent>
                    </Tabs>

                    <DialogFooter className="mt-8 border-t pt-4">
                        <Button type="button" variant="ghost" onClick={onClose}>
                            Cancel
                        </Button>
                        {activeTab !== 'participants' ? (
                            <Button type="button" onClick={handleContinue}>
                                Continue
                            </Button>
                        ) : (
                            <Button type="submit" disabled={mutation.isPending}>
                                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEditing ? 'Update Session' : 'Create Session'}
                            </Button>
                        )}
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
