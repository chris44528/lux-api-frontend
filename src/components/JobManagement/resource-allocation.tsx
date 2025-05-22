"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

// Sample resource allocation data - in a real app, this would come from your API
const resourceData = [
  {
    name: "Alex J.",
    maintenance: 4,
    installation: 2,
    repair: 3,
  },
  {
    name: "Sam W.",
    maintenance: 2,
    installation: 5,
    repair: 1,
  },
  {
    name: "Taylor S.",
    maintenance: 3,
    installation: 1,
    repair: 4,
  },
  {
    name: "Jordan B.",
    maintenance: 1,
    installation: 3,
    repair: 2,
  },
  {
    name: "Casey M.",
    maintenance: 5,
    installation: 2,
    repair: 2,
  },
]

export function ResourceAllocation() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resource Allocation</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            maintenance: {
              label: "Maintenance",
              color: "hsl(var(--chart-1))",
            },
            installation: {
              label: "Installation",
              color: "hsl(var(--chart-2))",
            },
            repair: {
              label: "Repair",
              color: "hsl(var(--chart-3))",
            },
          }}
          className="h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={resourceData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="maintenance" stackId="a" fill="var(--color-maintenance)" />
              <Bar dataKey="installation" stackId="a" fill="var(--color-installation)" />
              <Bar dataKey="repair" stackId="a" fill="var(--color-repair)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

