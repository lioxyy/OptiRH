import { useState } from 'react'
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
import { Loader2, GraduationCap, MapPin, Calendar, User, Globe } from 'lucide-react'

interface FormationFormProps {
    initialData?: any
    onClose: () => void
}

export function FormationForm({ initialData, onClose }: FormationFormProps) {
    const queryClient = useQueryClient()
    const [activeTab, setActiveTab] = useState('info')
    const [instructorType, setInstructorType] = useState<'local' | 'external'>(
        initialData?.external_instructor ? 'external' : 'local'
    )
    const isEditing = !!initialData

    const { register, handleSubmit, formState: { errors }, watch, setValue, trigger } = useForm<CreateFormationInput>({
        resolver: zodResolver(CreateFormationSchema),
        defaultValues: initialData ? {
            ...initialData,
            date_deb: new Date(initialData.date_deb).toISOString().split('T')[0]
        } : {
            duration_days: 1
        }
    })

    const { data: employees = [] } = useQuery({
        queryKey: ['employees'],
        queryFn: async () => {
            const res = await api.get('/api/employees')
            return res.data.data
        }
    })

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
        const isValid = await trigger(['name', 'description', 'location'])
        if (isValid) {
            setActiveTab('scheduling')
        }
    }

    const onSubmit = (data: CreateFormationInput) => {
        // Clean up unselected instructor type
        const payload = { ...data }
        if (instructorType === 'local') {
            payload.external_instructor = undefined
        } else {
            payload.id_instructor = undefined
        }
        mutation.mutate(payload)
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
                        <TabsList className="grid w-full grid-cols-2 mb-6">
                            <TabsTrigger value="info">Basic Information</TabsTrigger>
                            <TabsTrigger value="scheduling">Instructor & Dates</TabsTrigger>
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
                    </Tabs>

                    <DialogFooter className="mt-8 border-t pt-4">
                        <Button type="button" variant="ghost" onClick={onClose}>
                            Cancel
                        </Button>
                        {activeTab === 'info' ? (
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
