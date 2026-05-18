import * as React from 'react'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useAuth } from '../../context/auth-context'
import { Button } from '../../components/ui/button'
import { ColumnDef } from '@tanstack/react-table'
import { GenericDataTable, DataTableColumnHeader } from '../../components/ui/generic-data-table'
import { FormationForm } from './formation-form'
import { ParticipantManager } from './participant-manager'
import {
    GraduationCap,
    MapPin,
    Calendar,
    Clock,
    User,
    Users,
    Globe,
    MoreHorizontal,
    Edit,
    Trash
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
import { toast } from 'sonner'

export interface Formation {
    id_formation: number
    name: string
    description?: string | null
    location?: string | null
    date_deb: string
    duration_days: number
    id_instructor?: number | null
    external_instructor?: string | null
    instructor?: {
        id_emp: number
        name: string
    } | null
}

export function FormationPage() {
    const { user } = useAuth()
    const queryClient = useQueryClient()
    const [editingItem, setEditingItem] = useState<Formation | null>(null)
    const [showForm, setShowForm] = useState(false)
    const [managingParticipants, setManagingParticipants] = useState<Formation | null>(null)

    const { data: formations = [] } = useQuery<Formation[]>({
        queryKey: ['formations'],
        queryFn: async () => {
            const res = await api.get('/api/formations')
            return res.data.data
        },
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`/api/formations/${id}`)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['formations'] })
            toast.success('Formation deleted successfully')
        },
        onError: () => {
            toast.error('Failed to delete formation')
        },
    })

    const columns = React.useMemo<ColumnDef<Formation>[]>(() => [
        {
            id: "name",
            accessorKey: "name",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Formation Name" />,
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-medium">{row.original.name}</span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {row.original.location || 'Remote'}
                    </span>
                </div>
            )
        },
        {
            id: "date_deb",
            accessorKey: "date_deb",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Start Date" />,
            cell: ({ row }) => {
                const date = new Date(row.original.date_deb)
                return (
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{date.toLocaleDateString()}</span>
                    </div>
                )
            }
        },
        {
            id: "duration",
            accessorKey: "duration_days",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Duration" />,
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{row.original.duration_days} days</span>
                </div>
            )
        },
        {
            id: "instructor",
            accessorFn: (row) => row.instructor?.name || row.external_instructor,
            header: ({ column }) => <DataTableColumnHeader column={column} title="Instructor" />,
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    {row.original.id_instructor ? (
                        <User className="h-4 w-4 text-primary" />
                    ) : (
                        <Globe className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-sm">
                        {row.original.instructor?.name || row.original.external_instructor || 'N/A'}
                    </span>
                </div>
            )
        },
        {
            id: "actions",
            header: () => <div className="text-right px-4">Actions</div>,
            cell: ({ row }) => (
                <div className="flex justify-end px-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[160px]">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => setManagingParticipants(row.original)}>
                                <Users className="mr-2 h-4 w-4" />
                                Participants
                            </DropdownMenuItem>
                            {user?.role === 'Admin' && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => {
                                        setEditingItem(row.original)
                                        setShowForm(true)
                                    }}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        className="text-destructive focus:text-destructive"
                                        onClick={() => {
                                            if (confirm('Are you sure you want to delete this formation?')) {
                                                deleteMutation.mutate(row.original.id_formation)
                                            }
                                        }}
                                    >
                                        <Trash className="mr-2 h-4 w-4" />
                                        Delete
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )
        }
    ], [user, deleteMutation])

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Formations</h1>
                    <p className="text-sm text-muted-foreground">
                        Manage employee training programs and skills development.
                    </p>
                </div>
                {user?.role === 'Admin' && (
                    <Button onClick={() => {
                        setEditingItem(null)
                        setShowForm(true)
                    }}>
                        <GraduationCap className="mr-2 h-4 w-4" /> New Formation
                    </Button>
                )}
            </div>

            <div className="bg-card rounded-lg">
                <GenericDataTable
                    columns={columns}
                    data={formations}
                    searchOptions={[
                        { id: "name", label: "Formation Name" },
                        { id: "instructor", label: "Instructor" },
                        { id: "date_deb", label: "Start Date" }
                    ]}
                />
            </div>

            {showForm && (
                <FormationForm
                    initialData={editingItem}
                    onClose={() => setShowForm(false)}
                />
            )}

            {managingParticipants && (
                <ParticipantManager
                    formation={managingParticipants}
                    onClose={() => setManagingParticipants(null)}
                />
            )}
        </div>
    )
}
