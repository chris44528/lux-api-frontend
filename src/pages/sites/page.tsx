import { SiteList } from "@/components/SiteList"

export default function SitesPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Sites</h1>
      </div>
      <SiteList />
    </div>
  )
} 