"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin } from "lucide-react"

interface JobLocation {
  id: string
  title: string
  address: string
  lat: number
  lng: number
  status: string
}

// Sample job locations - in a real app, these would come from your API with geocoded addresses
const sampleLocations: JobLocation[] = [
  {
    id: "job-1",
    title: "Plumbing Repair",
    address: "123 Main St, Anytown",
    lat: 51.505,
    lng: -0.09,
    status: "pending",
  },
  {
    id: "job-2",
    title: "HVAC Installation",
    address: "456 Oak Ave, Somewhere",
    lat: 51.51,
    lng: -0.1,
    status: "in-progress",
  },
  {
    id: "job-4",
    title: "Roof Repair",
    address: "101 Cedar Ln, Nowhere",
    lat: 51.49,
    lng: -0.08,
    status: "pending",
  },
  {
    id: "job-5",
    title: "Window Replacement",
    address: "202 Birch St, Anywhere",
    lat: 51.5,
    lng: -0.12,
    status: "in-progress",
  },
]

export function JobMap() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Job Locations</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <p>Loading map...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Job Locations</CardTitle>
      </CardHeader>
      <CardContent className="h-[400px] relative">
        {/* In a real implementation, you would use a mapping library like Leaflet or Google Maps */}
        <div className="absolute inset-0 bg-gray-100 rounded-md overflow-hidden">
          {/* This is a placeholder for the actual map */}
          <div className="w-full h-full relative">
            {sampleLocations.map((location) => (
              <div
                key={location.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${(location.lng + 0.12) * 1000}%`,
                  top: `${(51.52 - location.lat) * 1000}%`,
                }}
              >
                <div className="relative group">
                  <MapPin
                    className={`h-6 w-6 ${
                      location.status === "pending"
                        ? "text-red-500"
                        : location.status === "in-progress"
                          ? "text-amber-500"
                          : "text-green-500"
                    }`}
                  />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                    {location.title}
                    <br />
                    {location.address}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="absolute bottom-2 right-2 bg-white p-2 rounded-md text-xs">
            This is a placeholder for an interactive map.
            <br />
            In a real implementation, integrate with Google Maps, Mapbox, or Leaflet.
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

