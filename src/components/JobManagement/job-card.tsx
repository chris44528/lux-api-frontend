"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Calendar, Clock, MapPin, MoreHorizontal, User } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { useState, useRef, useEffect } from "react"
import { cn } from "../../lib/utils"
import { Job, Technician } from "../../services/jobService"
import { format } from "date-fns"
import { Checkbox } from "../ui/checkbox"

interface JobCardProps {
  job: Job
  technicians: Technician[]
  overlay?: boolean
  onSelect?: (jobId: string, checked: boolean) => void
  isSelected?: boolean
}

export function JobCard({ job, technicians, overlay, onSelect, isSelected }: JobCardProps) {
  const navigate = useNavigate()
  
  // Configure sortable
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: job.id,
    data: {
      type: "job",
      job,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  // Get priority badge color
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400"
      case "medium":
        return "bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400"
      case "low":
        return "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300"
    }
  }

  // Find assigned technician
  const assignedTechnician = job.assigned_to 
    ? technicians.find((tech) => tech.id === job.assigned_to?.id) 
    : null

  const formattedDueDate = job.due_date 
    ? format(new Date(job.due_date), "MMM d, yyyy")
    : "No due date"

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-3 cursor-pointer hover:shadow-md transition-shadow",
        isDragging && "opacity-50",
        overlay && "shadow-lg"
      )}
      onClick={(e) => {
        // If the click is on the checkbox, don't navigate
        if ((e.target as HTMLElement).closest('.job-checkbox')) {
          e.stopPropagation();
          return;
        }
        navigate(`/jobs/${job.id}`);
      }}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center">
          {onSelect && (
            <div className="job-checkbox mr-2" onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => onSelect(job.id.toString(), checked as boolean)}
              />
            </div>
          )}
          <div>
            <h3 className="font-medium text-sm dark:text-gray-100">{job.title}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{job.client}</p>
          </div>
        </div>
        <Badge className={cn("text-xs", getPriorityColor(job.priority))}>
          {job.priority}
        </Badge>
      </div>
      
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">{job.client}</div>
      
      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-2">
        <MapPin className="h-3 w-3 mr-1" />
        <span className="truncate">{job.address}</span>
      </div>
      
      <div className="flex justify-between">
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
          <Calendar className="h-3 w-3 mr-1" />
          <span>{formattedDueDate}</span>
        </div>
        
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
          <Badge variant="outline" className="ml-2 px-1 border-dashed">
            {job.queue.name}
          </Badge>
        </div>
      </div>
      
      <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
        {assignedTechnician ? (
          <div className="flex items-center">
            <Avatar className="h-6 w-6 mr-1">
              <AvatarImage src={assignedTechnician.avatar || ""} alt={assignedTechnician.full_name || "Technician"} />
              <AvatarFallback>{(assignedTechnician.full_name || "T").charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-xs dark:text-gray-300">{assignedTechnician.full_name}</span>
          </div>
        ) : (
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <User className="h-3 w-3 mr-1" />
            <span>Unassigned</span>
          </div>
        )}
        
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
          <Clock className="h-3 w-3 mr-1" />
          <span>{job.estimated_duration || "N/A"}</span>
        </div>
      </div>
    </div>
  )
}

