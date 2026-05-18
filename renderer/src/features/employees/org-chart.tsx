import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Badge } from '../../components/ui/badge'
import { ChevronRight, ChevronDown, User } from 'lucide-react'

interface OrgNode {
  id_emp: number
  name: string
  role: string
  supervisor_id: number | null
  departments?: { name: string }[]
  children: OrgNode[]
}

function TreeNode({ node, depth = 0 }: { node: OrgNode; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 1)
  const hasChildren = node.children.length > 0

  const roleColor: Record<string, string> = {
    Admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    Agent: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    Employee: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  }

  return (
    <div className="select-none">
      <div
        className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50 cursor-pointer group"
        style={{ paddingLeft: `${depth * 24 + 8}px` }}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {hasChildren ? (
          expanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        ) : (
          <div className="w-3.5" />
        )}
        <div className="flex items-center justify-center h-6 w-6 rounded-full bg-muted">
          <User className="h-3 w-3 text-muted-foreground" />
        </div>
        <span className="text-sm font-medium">{node.name}</span>
        <Badge className={`text-[10px] px-1.5 py-0 h-4 ${roleColor[node.role] || ''}`} variant="outline">
          {node.role}
        </Badge>
        {node.departments && node.departments.length > 0 && (
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest bg-muted/80 px-2 py-0.5 rounded-sm border border-muted-foreground/10">
            {node.departments.map(d => d.name).join(', ')}
          </span>
        )}
      </div>
      {expanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <TreeNode key={child.id_emp} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export function OrgChart() {
  const { data: orgTree, isLoading } = useQuery<OrgNode[]>({
    queryKey: ['org-chart'],
    queryFn: async () => {
      const res = await api.get('/api/employees/org-chart')
      return res.data.data
    },
  })

  if (isLoading) return <div className="text-sm text-muted-foreground p-4">Loading org chart...</div>

  if (!orgTree || orgTree.length === 0) {
    return <div className="text-sm text-muted-foreground p-4">No employees found.</div>
  }

  return (
    <div className="p-4">
      {orgTree.map((node) => (
        <TreeNode key={node.id_emp} node={node} />
      ))}
    </div>
  )
}
