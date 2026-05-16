import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import data from "@/app/dashboard/data.json"

export function OverviewPage() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-4 p-4 pt-0">
      <SectionCards />
      <ChartAreaInteractive />
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable data={data} />
        </CardContent>
      </Card>
    </div>
  )
}
