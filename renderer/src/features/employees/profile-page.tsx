import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Badge } from '../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { UserCircle2, Mail, Phone, MapPin, CalendarDays, Briefcase, BadgeCheck } from 'lucide-react'

export function ProfilePage() {
  const { data: employee, isLoading } = useQuery({
    queryKey: ['employee', 'me'],
    queryFn: async () => {
      const res = await api.get(`/api/employees/me`)
      return res.data.data
    },
  })

  if (isLoading) return <div className="p-6">Loading...</div>
  if (!employee) return <div className="p-6 text-rose-500">Employee not found</div>

  return (
    <div className="max-w-3xl mx-auto w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 border-b border-border/40 pb-6">
        <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center">
          <UserCircle2 className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">{employee.name}</h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <BadgeCheck className="h-4 w-4 text-emerald-500" />
            Verified Employee
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Information */}
        <Card className="border-border/40 bg-card/40 backdrop-blur-sm shadow-xl shadow-black/5 rounded-2xl overflow-hidden">
          <CardHeader className="bg-muted/20 border-b border-border/40 py-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              Contact Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <dl className="divide-y divide-border/20">
              <div className="flex justify-between items-center px-5 py-4 hover:bg-muted/20 transition-colors">
                <dt className="text-sm text-muted-foreground flex items-center gap-2"><Mail className="h-4 w-4 opacity-70"/> Email</dt>
                <dd className="text-sm font-medium">{employee.email}</dd>
              </div>
              <div className="flex justify-between items-center px-5 py-4 hover:bg-muted/20 transition-colors">
                <dt className="text-sm text-muted-foreground flex items-center gap-2"><Phone className="h-4 w-4 opacity-70"/> Phone</dt>
                <dd className="text-sm font-medium">{employee.phone ?? '—'}</dd>
              </div>
              <div className="flex justify-between items-center px-5 py-4 hover:bg-muted/20 transition-colors">
                <dt className="text-sm text-muted-foreground flex items-center gap-2"><MapPin className="h-4 w-4 opacity-70"/> Address</dt>
                <dd className="text-sm font-medium">{employee.address ?? '—'}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* HR Information */}
        <Card className="border-border/40 bg-card/40 backdrop-blur-sm shadow-xl shadow-black/5 rounded-2xl overflow-hidden">
          <CardHeader className="bg-muted/20 border-b border-border/40 py-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" />
              Professional Info
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <dl className="divide-y divide-border/20">
              <div className="flex justify-between items-center px-5 py-4 hover:bg-muted/20 transition-colors">
                <dt className="text-sm text-muted-foreground">Role</dt>
                <dd><Badge variant={employee.role === 'Admin' ? 'default' : 'secondary'} className="rounded-lg">{employee.role}</Badge></dd>
              </div>
              <div className="flex justify-between items-center px-5 py-4 hover:bg-muted/20 transition-colors">
                <dt className="text-sm text-muted-foreground">Department ID</dt>
                <dd className="text-sm font-medium">{employee.id_dept ?? '—'}</dd>
              </div>
              <div className="flex justify-between items-center px-5 py-4 hover:bg-muted/20 transition-colors">
                <dt className="text-sm text-muted-foreground flex items-center gap-2"><CalendarDays className="h-4 w-4 opacity-70"/> Employment Date</dt>
                <dd className="text-sm font-medium">{employee.date_employment ? new Date(employee.date_employment).toLocaleDateString() : '—'}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
