import { Link, useLocation, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { api } from "../../lib/api"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "../../components/ui/breadcrumb"
import React from "react"

const routeConfig: Record<string, string> = {
    dashboard: "Dashboard",
    employees: "Employees",
    leave: "Leave",
    contracts: "Contracts",
    payroll: "Payroll",
    tasks: "Tasks",
    recruitment: "Recruitment",
    evaluations: "Evaluations",
    analytics: "Analytics",
    formations: "Formations",
}

export function DynamicBreadcrumb() {
    const location = useLocation()
    const { id } = useParams()
    const pathnames = location.pathname.split("/").filter((x) => x)

    // Fetch employee name if on employee detail page to show in breadcrumb
    const { data: employee } = useQuery({
        queryKey: ['employee', id],
        queryFn: async () => {
            const res = await api.get(`/api/employees/${id}`)
            return res.data.data
        },
        enabled: !!id && location.pathname.includes('/employees/')
    })

    return (
        <Breadcrumb>
            <BreadcrumbList>
                {pathnames.map((value, index) => {
                    const isLast = index === pathnames.length - 1
                    const to = `/${pathnames.slice(0, index + 1).join("/")}`

                    let label = routeConfig[value] || value

                    // Capitalize if not in config
                    if (!routeConfig[value]) {
                        label = value.charAt(0).toUpperCase() + value.slice(1)
                    }

                    // Special case for IDs (Employee Name)
                    if (value === id && employee) {
                        label = employee.name
                    }

                    return (
                        <React.Fragment key={to}>
                            <BreadcrumbItem>
                                {isLast ? (
                                    <BreadcrumbPage>{label}</BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink asChild>
                                        <Link to={to}>{label}</Link>
                                    </BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                            {!isLast && <BreadcrumbSeparator />}
                        </React.Fragment>
                    )
                })}
            </BreadcrumbList>
        </Breadcrumb>
    )
}
