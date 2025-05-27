import { useState } from "react"
import { Check, Filter, Search, X } from "lucide-react"
import { Button } from "../ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Checkbox } from "../ui/checkbox"
import { Label } from "../ui/label"
import { Badge } from "../ui/badge"
import { Technician, JobQueue, JobStatus } from "../../services/jobService"
import { Separator } from "../ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Input } from "../ui/input"

export interface JobFilters {
  status: string[]
  priority: string[]
  assignedTo: string[]
  queue: string[]
  saveAsDefault: boolean
  defaultQueue: string | null
  search: string
}

interface JobFilterProps {
  filters: JobFilters
  onFiltersChange: (filters: JobFilters) => void
  technicians: Technician[]
  statuses: JobStatus[]
  queues: JobQueue[]
  loading: boolean
}

export function JobFilter({ 
  filters, 
  onFiltersChange, 
  technicians,
  statuses,
  queues,
  loading
}: JobFilterProps) {
  const [open, setOpen] = useState(false)

  const priorityOptions = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" }
  ]

  const handleStatusChange = (status: string, checked: boolean) => {
    const newStatuses = checked
      ? [...filters.status, status]
      : filters.status.filter(s => s !== status)
    
    onFiltersChange({
      ...filters,
      status: newStatuses
    })
  }

  const handlePriorityChange = (priority: string, checked: boolean) => {
    const newPriorities = checked
      ? [...filters.priority, priority]
      : filters.priority.filter(p => p !== priority)
    
    onFiltersChange({
      ...filters,
      priority: newPriorities
    })
  }

  const handleAssignedToChange = (techId: string, checked: boolean) => {
    const newAssignedTo = checked
      ? [...filters.assignedTo, techId]
      : filters.assignedTo.filter(t => t !== techId)
    
    onFiltersChange({
      ...filters,
      assignedTo: newAssignedTo
    })
  }

  const handleQueueChange = (queue: string, checked: boolean) => {
    const newQueues = checked
      ? [...filters.queue, queue]
      : filters.queue.filter(q => q !== queue)
    
    onFiltersChange({
      ...filters,
      queue: newQueues
    })
  }

  const handleDefaultQueueChange = (queueId: string | null) => {
    onFiltersChange({
      ...filters,
      defaultQueue: queueId
    })
  }

  const handleSaveDefaultChange = (checked: boolean) => {
    onFiltersChange({
      ...filters,
      saveAsDefault: checked
    })
  }

  const handleSearchChange = (search: string) => {
    onFiltersChange({
      ...filters,
      search: search
    })
  }

  const resetFilters = () => {
    onFiltersChange({
      status: [],
      priority: [],
      assignedTo: [],
      queue: [],
      saveAsDefault: filters.saveAsDefault,
      defaultQueue: filters.defaultQueue,
      search: ""
    })
  }

  const totalActiveFilters = 
    filters.status.length + 
    filters.priority.length + 
    filters.assignedTo.length + 
    filters.queue.length

  const getAdvancedFilterContent = () => {
    if (loading) {
      return (
        <div className="p-4 text-center">
          <div className="h-4 w-4 spinner mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading filters...</p>
        </div>
      )
    }
    
    return (
      <>
        <div className="p-4">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2 text-gray-900 dark:text-gray-100">Default Queue</h4>
              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-gray-300">Default Queue</Label>
                <Select
                  value={filters.defaultQueue || undefined}
                  onValueChange={handleDefaultQueueChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select default queue" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {queues.map((queue) => (
                      <SelectItem key={queue.id} value={queue.id.toString()}>
                        {queue.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />
            
            <div>
              <h4 className="font-medium mb-2 text-gray-900 dark:text-gray-100">Priority</h4>
              <div className="space-y-2">
                {priorityOptions.map(option => (
                  <div key={option.value} className="flex items-center">
                    <Checkbox 
                      id={`priority-${option.value}`}
                      checked={filters.priority.includes(option.value)}
                      onCheckedChange={(checked) => 
                        handlePriorityChange(option.value, checked === true)
                      }
                    />
                    <Label 
                      htmlFor={`priority-${option.value}`}
                      className="ml-2 text-sm font-normal text-gray-700 dark:text-gray-300"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-medium mb-2 text-gray-900 dark:text-gray-100">Assigned To</h4>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Checkbox 
                    id="assigned-unassigned"
                    checked={filters.assignedTo.includes('unassigned')}
                    onCheckedChange={(checked) => 
                      handleAssignedToChange('unassigned', checked === true)
                    }
                  />
                  <Label 
                    htmlFor="assigned-unassigned"
                    className="ml-2 text-sm font-normal text-gray-700 dark:text-gray-300"
                  >
                    Unassigned
                  </Label>
                </div>
                {Array.isArray(technicians) && technicians.map(tech => (
                  <div key={tech.id} className="flex items-center">
                    <Checkbox 
                      id={`tech-${tech.id}`}
                      checked={filters.assignedTo.includes(String(tech.id))}
                      onCheckedChange={(checked) => 
                        handleAssignedToChange(String(tech.id), checked === true)
                      }
                    />
                    <Label 
                      htmlFor={`tech-${tech.id}`}
                      className="ml-2 text-sm font-normal text-gray-700 dark:text-gray-300"
                    >
                      {tech.full_name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-medium mb-2 text-gray-900 dark:text-gray-100">Queue</h4>
              <div className="space-y-2">
                {Array.isArray(queues) && queues.map(queue => (
                  <div key={queue.id} className="flex items-center">
                    <Checkbox 
                      id={`queue-${queue.id}`}
                      checked={filters.queue.includes(queue.name)}
                      onCheckedChange={(checked) => 
                        handleQueueChange(queue.name, checked === true)
                      }
                    />
                    <Label 
                      htmlFor={`queue-${queue.id}`}
                      className="ml-2 text-sm font-normal text-gray-700 dark:text-gray-300"
                    >
                      {queue.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            <Separator />
            
            <div className="flex items-center">
              <Checkbox 
                id="save-default"
                checked={filters.saveAsDefault}
                onCheckedChange={(checked) => 
                  handleSaveDefaultChange(checked === true)
                }
              />
              <Label 
                htmlFor="save-default"
                className="ml-2 text-sm font-normal text-gray-700 dark:text-gray-300"
              >
                Save as default filters
              </Label>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between p-4 pt-0 border-t dark:border-gray-700">
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="h-8 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Reset
          </Button>
          <Button
            size="sm"
            onClick={() => setOpen(false)}
            className="h-8 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Apply Filters
          </Button>
        </div>
      </>
    )
  }

  return (
    <div className="w-full space-y-2">
      {/* Main filter bar */}
      <div className="flex flex-wrap items-center gap-2 w-full">
        {/* Search input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground dark:text-gray-400" />
          <Input
            type="text"
            placeholder="Search by client, title, or site..."
            className="pl-8 h-9 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            value={filters.search || ""}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          {filters.search && (
            <button 
              className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground dark:text-gray-400 dark:hover:text-gray-200"
              onClick={() => handleSearchChange("")}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        {/* Status filters */}
        <div className="flex items-center gap-1">
          {Array.isArray(statuses) && statuses.map(status => (
            <Button
              key={status.id}
              variant={filters.status.includes(status.name) ? "default" : "outline"}
              size="sm"
              className={`h-8 ${
                filters.status.includes(status.name) 
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90" 
                  : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
              onClick={() => handleStatusChange(status.name, !filters.status.includes(status.name))}
            >
              {status.name}
            </Button>
          ))}
        </div>
        
        {/* Advanced filters button */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-8 border-dashed border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
              <Filter className="mr-2 h-3.5 w-3.5" />
              Advanced
              {totalActiveFilters > 0 && (
                <Badge 
                  variant="secondary" 
                  className="ml-2 rounded-sm px-1 font-normal bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                >
                  {totalActiveFilters}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 bg-white dark:bg-gray-800 border dark:border-gray-700" align="end">
            {getAdvancedFilterContent()}
          </PopoverContent>
        </Popover>
      </div>
      
      {/* Active filters display */}
      {totalActiveFilters > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.status.map(status => (
            <Badge 
              key={`status-${status}`} 
              variant="secondary"
              className="cursor-pointer h-6 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
              onClick={() => handleStatusChange(status, false)}
            >
              {status}
              <Check className="ml-1 h-3 w-3" />
            </Badge>
          ))}
          {filters.priority.map(priority => (
            <Badge 
              key={`priority-${priority}`} 
              variant="secondary"
              className="cursor-pointer h-6 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
              onClick={() => handlePriorityChange(priority, false)}
            >
              {priority}
              <Check className="ml-1 h-3 w-3" />
            </Badge>
          ))}
          {filters.assignedTo.map(techId => {
            if (techId === 'unassigned') {
              return (
                <Badge 
                  key="unassigned" 
                  variant="secondary"
                  className="cursor-pointer h-6 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                  onClick={() => handleAssignedToChange(techId, false)}
                >
                  Unassigned
                  <Check className="ml-1 h-3 w-3" />
                </Badge>
              )
            }
            const tech = technicians.find(t => String(t.id) === techId)
            return tech ? (
              <Badge 
                key={`tech-${techId}`} 
                variant="secondary"
                className="cursor-pointer h-6 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                onClick={() => handleAssignedToChange(techId, false)}
              >
                {tech.full_name}
                <Check className="ml-1 h-3 w-3" />
              </Badge>
            ) : null
          })}
          {filters.queue.map(queue => (
            <Badge 
              key={`queue-${queue}`} 
              variant="secondary"
              className="cursor-pointer h-6 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
              onClick={() => handleQueueChange(queue, false)}
            >
              {queue}
              <Check className="ml-1 h-3 w-3" />
            </Badge>
          ))}
          {totalActiveFilters > 1 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={resetFilters}
              className="h-6 px-2 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              Clear all
            </Button>
          )}
        </div>
      )}
    </div>
  )
} 