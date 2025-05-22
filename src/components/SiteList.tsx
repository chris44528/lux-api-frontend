import { useEffect, useState } from "react"
import { SiteCard } from "./SiteCard"
import useEcotricityUser from "../hooks/useEcotricityUser"

interface Site {
  Site_id: number
  Site_Name: string
  Address: string
  Postcode: string
  last_reading: string
  last_updated: string
  account?: string
}

interface ApiResponse {
  count: number
  next: string | null
  previous: string | null
  results: Site[]
}

export function SiteList() {
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { isEcotricityUser, loading: userLoading } = useEcotricityUser()

  useEffect(() => {
    const fetchSites = async () => {
      if (userLoading) return; // Wait until we know if user is Ecotricity or not
      
      try {
        const params = new URLSearchParams({
          search: '',
          filter: 'all',
          page: '1',
          ordering: '-Site_id'
        })
        
        // Add account filter for Ecotricity users
        if (isEcotricityUser) {
          params.append('account', 'ecotricity');
        }
        
        const response = await fetch(`/api/sites/?${params}`)
        if (!response.ok) {
          throw new Error('Failed to fetch sites')
        }
        const data: ApiResponse = await response.json()
        setSites(data.results)
      } catch (err) {
        console.error('Error fetching sites:', err) // Debug log
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchSites()
  }, [isEcotricityUser, userLoading])

  if (loading || userLoading) {
    return <div>Loading sites...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  if (!sites.length) {
    return <div>No sites found</div>
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {sites.map((site) => (
        <SiteCard 
          key={site.Site_id} 
          site={{
            id: site.Site_id,
            site_id: site.Site_id,
            site_name: site.Site_Name,
            address: site.Address,
            postcode: site.Postcode,
            last_reading: site.last_reading,
            last_updated: site.last_updated,
            account: site.account
          }} 
        />
      ))}
    </div>
  )
} 