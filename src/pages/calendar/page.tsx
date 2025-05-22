"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Select } from "../../components/ui/select"
import { ChevronLeft, ChevronRight } from "lucide-react"

// Sample job data for the calendar
const calendarJobs = [
  { id: "job-1", title: "Plumbing Repair", client: "John Smith", time: "09:00", duration: 2, day: 1 },
  { id: "job-2", title: "HVAC Installation", client: "Sarah Johnson", time: "13:00", duration: 4, day: 1 },
  { id: "job-3", title: "Electrical Inspection", client: "Michael Brown", time: "10:00", duration: 1, day: 2 },
  { id: "job-4", title: "Roof Repair", client: "Emily Davis", time: "14:00", duration: 3, day: 3 },
  { id: "job-5", title: "Window Replacement", client: "David Wilson", time: "11:00", duration: 2, day: 4 },
  { id: "job-6", title: "Plumbing Maintenance", client: "Lisa Taylor", time: "09:30", duration: 1.5, day: 5 },
]

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
const hours = [9, 10, 11, 12, 13, 14, 15, 16, 17]

export default function CalendarPage() {
  const [currentWeek, setCurrentWeek] = useState("Apr 1 - Apr 5, 2025")
  const [view, setView] = useState("week")

  const getJobsForDay = (day: number) => {
    return calendarJobs.filter((job) => job.day === day)
  }

  const getJobStyle = (job: any) => {
    const startHour = Number.parseInt(job.time.split(":")[0])
    const startMinute = Number.parseInt(job.time.split(":")[1] || "0")
    const startPosition = startHour - 9 + startMinute / 60
    const height = job.duration

    return {
      top: `${startPosition * 4}rem`,
      height: `${height * 4}rem`,
      left: "0.5rem",
      right: "0.5rem",
    }
  }

  const getStatusColor = (job: any) => {
    // In a real app, this would be based on the job's status
    const colors = [
      "bg-red-100 border-red-500 dark:bg-red-900/30 dark:border-red-400", 
      "bg-amber-100 border-amber-500 dark:bg-amber-900/30 dark:border-amber-400", 
      "bg-green-100 border-green-500 dark:bg-green-900/30 dark:border-green-400"
    ]
    return colors[job.id.charCodeAt(4) % 3]
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      <main className="flex-1 p-4 md:p-6">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold dark:text-gray-100">Job Calendar</h1>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-medium dark:text-gray-300">{currentWeek}</div>
            <Button variant="outline" size="icon">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Select 
              options={[
                { value: "day", label: "Day" },
                { value: "week", label: "Week" },
                { value: "month", label: "Month" }
              ]}
              value={view}
              onChange={(e) => setView(e.target.value)}
              className="w-[120px]"
            />
          </div>
        </div>

        <Card className="dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="dark:text-gray-100">Weekly Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-[4rem_1fr] border rounded-md dark:border-gray-700">
              {/* Time labels */}
              <div className="border-r dark:border-gray-700">
                <div className="h-10 border-b dark:border-gray-700"></div>
                {hours.map((hour) => (
                  <div key={hour} className="h-16 border-b dark:border-gray-700 relative">
                    <span className="absolute -top-2.5 -left-0.5 text-xs text-muted-foreground dark:text-gray-400">{hour}:00</span>
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-5">
                {/* Day headers */}
                {days.map((day, index) => (
                  <div key={day} className="h-10 border-b border-r dark:border-gray-700 px-2 py-1 text-center font-medium dark:text-gray-300">
                    {day}
                  </div>
                ))}

                {/* Calendar cells */}
                {days.map((day, dayIndex) => (
                  <div key={day} className="relative border-r dark:border-gray-700">
                    {hours.map((hour) => (
                      <div key={hour} className="h-16 border-b dark:border-gray-700"></div>
                    ))}

                    {/* Jobs for this day */}
                    {getJobsForDay(dayIndex + 1).map((job) => (
                      <div
                        key={job.id}
                        className={`absolute rounded-md border-l-4 p-2 text-xs shadow-sm ${getStatusColor(job)}`}
                        style={getJobStyle(job)}
                      >
                        <div className="font-medium dark:text-gray-900">{job.title}</div>
                        <div className="text-muted-foreground dark:text-gray-800">
                          {job.time} • {job.client}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

