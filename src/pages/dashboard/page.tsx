"use client"

import { useEffect, useState } from "react"
import { SiteList } from "@/components/SiteList"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users } from "lucide-react"
import useEcotricityUser from "../../hooks/useEcotricityUser"
import { searchSites } from "@/services/api"

interface DashboardState {
  isLoading: boolean
  sitesCount: number
}

export default function DashboardPage() {
  const [state, setState] = useState<DashboardState>({
    isLoading: true,
    sitesCount: 0
  })
  const { isEcotricityUser, loading: userLoading } = useEcotricityUser()

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (userLoading) return; // Wait until we know if user is Ecotricity or not
      
      try {
        // Use authenticated API service to fetch sites
        const data = await searchSites(
          "", // empty search term
          1,  // page 1
          10, // pageSize (we only need the count)
          isEcotricityUser, // pass the ecotricity user flag
          "all", // filter
          "-Site_id" // default ordering
        )
        
        setState(prev => ({
          ...prev,
          isLoading: false,
          sitesCount: data.count
        }))
      } catch (error) {
        setState(prev => ({
          ...prev,
          isLoading: false
        }))
      }
    }

    fetchDashboardData()
  }, [isEcotricityUser, userLoading])

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 space-y-4 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sites</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{state.isLoading || userLoading ? '...' : state.sitesCount}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="sites">
          <TabsList>
            <TabsTrigger value="sites">Sites</TabsTrigger>
          </TabsList>
          <TabsContent value="sites" className="mt-4">
            <SiteList />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

