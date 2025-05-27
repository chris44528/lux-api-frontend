import { useEffect, useState } from "react"
import { SiteCard } from "./SiteCard"
import useEcotricityUser from "../hooks/useEcotricityUser"
import { searchSites } from "../services/api"

interface Site {
  Site_id: number
  Site_Name: string
  Address: string
  Postcode: string
  last_reading: string
  last_updated: string
  account?: string
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
        const data = await searchSites(
          '', // searchTerm
          1, // page
          10, // pageSize
          isEcotricityUser, // isEcotricityUser
          'all', // filter
          '-Site_id' // ordering
        )
        setSites(data.results)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchSites()
  }, [isEcotricityUser, userLoading])

  if (loading || userLoading) {
    return <div className="text-gray-900 dark:text-gray-100">Loading sites...</div>
  }

  if (error) {
    return <div className="text-red-600 dark:text-red-400">Error: {error}</div>
  }

  if (!sites.length) {
    return <div className="text-gray-500 dark:text-gray-400">No sites found</div>
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