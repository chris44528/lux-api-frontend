"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Sample workload data - in a real app, this would come from your API
const workloadData = [
  { day: "Mon", hour: 9, value: 3 },
  { day: "Mon", hour: 10, value: 5 },
  { day: "Mon", hour: 11, value: 7 },
  { day: "Mon", hour: 12, value: 4 },
  { day: "Mon", hour: 13, value: 2 },
  { day: "Mon", hour: 14, value: 6 },
  { day: "Mon", hour: 15, value: 8 },
  { day: "Mon", hour: 16, value: 5 },
  { day: "Mon", hour: 17, value: 3 },

  { day: "Tue", hour: 9, value: 4 },
  { day: "Tue", hour: 10, value: 6 },
  { day: "Tue", hour: 11, value: 8 },
  { day: "Tue", hour: 12, value: 5 },
  { day: "Tue", hour: 13, value: 3 },
  { day: "Tue", hour: 14, value: 7 },
  { day: "Tue", hour: 15, value: 9 },
  { day: "Tue", hour: 16, value: 6 },
  { day: "Tue", hour: 17, value: 4 },

  { day: "Wed", hour: 9, value: 2 },
  { day: "Wed", hour: 10, value: 4 },
  { day: "Wed", hour: 11, value: 6 },
  { day: "Wed", hour: 12, value: 3 },
  { day: "Wed", hour: 13, value: 1 },
  { day: "Wed", hour: 14, value: 5 },
  { day: "Wed", hour: 15, value: 7 },
  { day: "Wed", hour: 16, value: 4 },
  { day: "Wed", hour: 17, value: 2 },

  { day: "Thu", hour: 9, value: 5 },
  { day: "Thu", hour: 10, value: 7 },
  { day: "Thu", hour: 11, value: 9 },
  { day: "Thu", hour: 12, value: 6 },
  { day: "Thu", hour: 13, value: 4 },
  { day: "Thu", hour: 14, value: 8 },
  { day: "Thu", hour: 15, value: 10 },
  { day: "Thu", hour: 16, value: 7 },
  { day: "Thu", hour: 17, value: 5 },

  { day: "Fri", hour: 9, value: 3 },
  { day: "Fri", hour: 10, value: 5 },
  { day: "Fri", hour: 11, value: 7 },
  { day: "Fri", hour: 12, value: 4 },
  { day: "Fri", hour: 13, value: 2 },
  { day: "Fri", hour: 14, value: 6 },
  { day: "Fri", hour: 15, value: 8 },
  { day: "Fri", hour: 16, value: 5 },
  { day: "Fri", hour: 17, value: 3 },
]

const days = ["Mon", "Tue", "Wed", "Thu", "Fri"]
const hours = [9, 10, 11, 12, 13, 14, 15, 16, 17]

const getColorForValue = (value: number) => {
  if (value <= 2) return "bg-green-200"
  if (value <= 4) return "bg-green-400"
  if (value <= 6) return "bg-amber-300"
  if (value <= 8) return "bg-amber-500"
  return "bg-red-500"
}

export function WorkloadHeatmap() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Workload Heatmap</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col">
          <div className="flex items-center mb-2">
            <div className="w-16"></div>
            {hours.map((hour) => (
              <div key={hour} className="flex-1 text-center text-sm font-medium">
                {hour}:00
              </div>
            ))}
          </div>

          {days.map((day) => (
            <div key={day} className="flex items-center mb-1">
              <div className="w-16 text-sm font-medium">{day}</div>
              {hours.map((hour) => {
                const cellData = workloadData.find((d) => d.day === day && d.hour === hour)
                const value = cellData ? cellData.value : 0

                return (
                  <TooltipProvider key={`${day}-${hour}`}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className={`flex-1 h-8 mx-0.5 rounded ${getColorForValue(value)}`}></div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {day} {hour}:00 - {value} jobs
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )
              })}
            </div>
          ))}

          <div className="flex items-center mt-4 justify-center">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-200 rounded"></div>
              <span className="text-xs">Light</span>
            </div>
            <div className="w-4"></div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-400 rounded"></div>
              <span className="text-xs">Normal</span>
            </div>
            <div className="w-4"></div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-amber-300 rounded"></div>
              <span className="text-xs">Busy</span>
            </div>
            <div className="w-4"></div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-amber-500 rounded"></div>
              <span className="text-xs">Very Busy</span>
            </div>
            <div className="w-4"></div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-xs">Overloaded</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

