import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Link } from "react-router-dom"

interface SiteCardProps {
  site: {
    id: number
    site_id: number
    site_name: string
    address: string
    postcode: string
    last_reading: string
    last_updated: string
    account?: string
  }
}

export function SiteCard({ site }: SiteCardProps) {
  return (
    <Link to={`/sites/${site.site_id}`}>
      <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
        <CardHeader>
          <CardTitle className="text-lg">{site.site_name}</CardTitle>
          {site.account && (
            <div className="text-xs font-medium text-green-600">
              {site.account}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-sm text-gray-600">
              {site.address}
            </div>
            <div className="text-sm text-gray-600">
              {site.postcode}
            </div>
            <div className="text-sm">
              <span className="font-medium">Last Reading:</span> {site.last_reading}
            </div>
            <div className="text-xs text-gray-500">
              Updated: {new Date(site.last_updated).toLocaleString()}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
} 