"use client"

import React from "react"
import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Separator } from "../ui/separator"
import { DashboardHeader } from "./dashboard-header"
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  FileText, 
  Link, 
  Link2,
  Link2Off,
  Plus,
  Edit,
  MoreHorizontal,
  ChevronDown,
  Phone,
  Mail,
  ChevronRight,
  CheckCircle,
  Circle
} from "lucide-react"
import { JobTaskFlow } from "./job-task-flow"
import { formatDistanceToNow } from "date-fns"
import { JobHistoricalNotesModal } from "./JobHistoricalNotesModal"
import { ViewAllNotesModal } from "./ViewAllNotesModal"
import jobService from "../../services/jobService"

// Mock job data for the detail view
const mockJob = {
  id: "job-1",
  title: "Investigate Zero Readings at Site LUX-87654",
  client: "Oxford Housing Association",
  address: "123 Main St, Oxford, OX1 1AA",
  priority: "high",
  status: "in-progress",
  dueDate: "2025-04-01",
  assignedTo: "tech-1",
  queue: "Electrical",
  type: "Repair",
  category: "Solar Meters",
  description: "This site has reported zero readings for the past 7 days. Need to investigate the cause and restore functionality. Previous tests indicated potential communication issues.",
  site: {
    id: 123,
    name: "Oxford Community Solar",
    postcode: "OX1 1AA"
  },
  tasks: [
    {
      id: "task-1",
      name: "Zero Read Investigation",
      status: "in_progress",
      completionPercentage: 25
    }
  ],
  notes: [
    {
      id: "note-1",
      content: "Initial review shows the meter is powered but not transmitting data.",
      createdAt: "2025-03-24T09:30:00",
      createdBy: "John Smith"
    },
    {
      id: "note-2",
      content: "Called site owner to arrange access for tomorrow.",
      createdAt: "2025-03-24T11:45:00",
      createdBy: "Jane Doe"
    }
  ],
  attachments: [
    {
      id: "attach-1",
      filename: "site-photo.jpg",
      uploadedAt: "2025-03-24T09:35:00",
      uploadedBy: "John Smith",
      fileType: "image/jpeg",
      fileSize: "1.2 MB"
    }
  ],
  linkedJobs: [
    {
      id: "job-2",
      title: "Upgrade Meter Firmware at LUX-87654",
      status: "pending",
      linkType: "related",
      syncOptions: {
        syncNotes: true,
        syncStatus: false,
        syncAttachments: true
      }
    }
  ],
  createdAt: "2025-03-23T14:30:00",
  createdBy: "System Automation"
}

// Mock technicians data
const mockTechnicians = [
  { id: "tech-1", name: "Alex Johnson", avatar: "/placeholder.svg?height=40&width=40", specialization: "Electrical" },
  { id: "tech-2", name: "Sam Williams", avatar: "/placeholder.svg?height=40&width=40", specialization: "Solar" },
  { id: "tech-3", name: "Taylor Smith", avatar: "/placeholder.svg?height=40&width=40", specialization: "Metering" },
]

export function JobDetail() {
  const params = useParams<{ id: string }>()
  const [job] = useState(mockJob)
  const [activeTab, setActiveTab] = useState("overview")
  const [showLinkOptions, setShowLinkOptions] = useState(false)
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false)
  const [isViewAllNotesModalOpen, setIsViewAllNotesModalOpen] = useState(false)

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-amber-100 text-amber-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-red-100 text-red-800"
      case "in-progress":
        return "bg-amber-100 text-amber-800"
      case "completed":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getQueueColor = (queue: string) => {
    switch (queue) {
      case "Legal":
        return "bg-purple-100 text-purple-800"
      case "Electrical":
        return "bg-blue-100 text-blue-800"
      case "Roofing":
        return "bg-orange-100 text-orange-800"
      case "Biomass":
        return "bg-teal-100 text-teal-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const assignedTech = mockTechnicians.find((tech) => tech.id === job.assignedTo)
  const dueDate = new Date(job.dueDate)
  const isOverdue = dueDate < new Date()
  const dueText = formatDistanceToNow(dueDate, { addSuffix: true })

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1 p-4 md:p-6">
        {/* Job header with basic info and actions */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-2xl font-bold">{job.title}</h1>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge className={getStatusColor(job.status)}>{job.status.replace("-", " ")}</Badge>
                <Badge className={getPriorityColor(job.priority)}>{job.priority}</Badge>
                <Badge className={getQueueColor(job.queue)}>{job.queue}</Badge>
                <Badge variant="outline">{job.type}</Badge>
                <Badge variant="outline">{job.category}</Badge>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit Job
              </Button>
              <div className="relative">
                <Button 
                  variant="outline"
                  onClick={() => setShowLinkOptions(!showLinkOptions)}
                  className="gap-2"
                >
                  <Link2 className="h-4 w-4" />
                  Link Job
                  <ChevronDown className="h-4 w-4" />
                </Button>
                {showLinkOptions && (
                  <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                    <div className="py-1">
                      <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Create New Related Job
                      </button>
                      <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Link to Existing Job
                      </button>
                      <Separator className="my-1" />
                      <div className="px-4 py-2 text-xs font-semibold text-gray-500">Link Type</div>
                      <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Parent/Child Relationship
                      </button>
                      <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Related Jobs
                      </button>
                      <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Duplicate Jobs
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Job Details Section */}
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2">
              <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="overview">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="tasks">Tasks & Workflow</TabsTrigger>
                  <TabsTrigger value="notes">Notes & History</TabsTrigger>
                  <TabsTrigger value="attachments">Attachments</TabsTrigger>
                </TabsList>
                <div className="mt-6">
                  <TabsContent value="overview">
                    <Card>
                      <CardHeader>
                        <CardTitle>Job Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Description</h3>
                          <p className="mt-1">{job.description}</p>
                        </div>
                        
                        <Separator />
                        
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Site Information</h3>
                            <div className="mt-1">
                              <div className="font-medium">{job.site.name}</div>
                              <div className="text-gray-700">{job.site.id}</div>
                              <div className="text-gray-700">{job.site.postcode}</div>
                            </div>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Address</h3>
                            <div className="mt-1 flex items-start">
                              <MapPin className="h-4 w-4 text-gray-500 mt-0.5 mr-1" />
                              <span>{job.address}</span>
                            </div>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Client</h3>
                            <div className="mt-1 flex items-center">
                              <User className="h-4 w-4 text-gray-500 mr-1" />
                              <span>{job.client}</span>
                            </div>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Due Date</h3>
                            <div className="mt-1 flex items-center">
                              <Calendar className="h-4 w-4 text-gray-500 mr-1" />
                              <span className={isOverdue ? "text-red-600 font-medium" : ""}>
                                {new Date(job.dueDate).toLocaleDateString()} ({dueText})
                              </span>
                            </div>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Created</h3>
                            <div className="mt-1 flex items-center">
                              <Clock className="h-4 w-4 text-gray-500 mr-1" />
                              <span>
                                {new Date(job.createdAt).toLocaleDateString()} by {job.createdBy}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Recent Notes Section */}
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <h3 className="text-lg font-medium">Recent Notes</h3>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="flex items-center gap-1"
                          onClick={() => setIsViewAllNotesModalOpen(true)}
                        >
                          <span>View All</span>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                      <Card>
                        <CardContent className="py-4">
                          <div className="space-y-4">
                            {job.notes.slice(0, 2).map(note => (
                              <div key={note.id} className="flex gap-3">
                                <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0"></div>
                                <div>
                                  <h4 className="font-medium">{note.createdBy}</h4>
                                  <p className="text-sm text-gray-500 mt-0.5">
                                    {new Date(note.createdAt).toLocaleString()}
                                  </p>
                                  <p className="mt-1">{note.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                  
                  {/* Tasks and Workflow Tab */}
                  <TabsContent value="tasks">
                    {job.tasks.length > 0 ? (
                      <JobTaskFlow jobId={job.id} taskId={job.tasks[0].id} />
                    ) : (
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center p-6">
                            <h3 className="text-lg font-medium mb-2">No tasks assigned to this job</h3>
                            <p className="text-gray-500 mb-4">Assign a task template to start the workflow</p>
                            <Button>
                              <Plus className="mr-2 h-4 w-4" />
                              Assign Task Template
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                  
                  {/* Notes Tab */}
                  <TabsContent value="notes">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle>Notes</CardTitle>
                        <div className="flex gap-2">
                          <Button 
                            size="sm"
                            variant="ghost"
                            className="flex items-center gap-1"
                            onClick={() => setIsNotesModalOpen(true)}
                          >
                            <span>View All</span>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                          <Button size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Note
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {job.notes.map(note => (
                            <div key={note.id} className="border rounded-md p-4">
                              <div className="flex justify-between items-start">
                                <div className="font-medium">{note.createdBy}</div>
                                <div className="text-sm text-gray-500">
                                  {new Date(note.createdAt).toLocaleString()}
                                </div>
                              </div>
                              <p className="mt-2">{note.content}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  {/* Attachments Tab */}
                  <TabsContent value="attachments">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle>Attachments</CardTitle>
                        <Button size="sm">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Attachment
                        </Button>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {job.attachments.map(attachment => (
                            <div key={attachment.id} className="border rounded-md p-4 flex justify-between items-center">
                              <div className="flex items-center">
                                <FileText className="h-10 w-10 text-blue-500 mr-3" />
                                <div>
                                  <div className="font-medium">{attachment.filename}</div>
                                  <div className="text-sm text-gray-500">
                                    {attachment.fileSize} • {attachment.fileType} • Uploaded by {attachment.uploadedBy}
                                  </div>
                                </div>
                              </div>
                              <Button variant="outline" size="sm">Download</Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
            
            {/* Sidebar */}
            <div className="space-y-6">
              {/* Assignment Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Assignment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {assignedTech ? (
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <img 
                            src={assignedTech.avatar} 
                            alt={assignedTech.name} 
                            className="h-10 w-10 rounded-full bg-gray-200" 
                          />
                        </div>
                        <div>
                          <div className="font-medium">{assignedTech.name}</div>
                          <div className="text-sm text-gray-500">{assignedTech.specialization}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-2">No technician assigned</div>
                    )}
                    <Button className="w-full">Reassign</Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Linked Jobs Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Linked Jobs</CardTitle>
                  <CardDescription>Jobs that are connected to this one</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {job.linkedJobs.length > 0 ? (
                    job.linkedJobs.map(linkedJob => (
                      <div key={linkedJob.id} className="border rounded-md p-3">
                        <div className="flex justify-between items-start">
                          <div className="font-medium">{linkedJob.title}</div>
                          <Badge className={getStatusColor(linkedJob.status)}>{linkedJob.status}</Badge>
                        </div>
                        <div className="flex items-center text-sm text-gray-500 mt-2">
                          <Link className="h-4 w-4 mr-1" />
                          <span>{linkedJob.linkType}</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="text-xs space-y-1">
                          <div className="flex items-center">
                            <div className={`h-2 w-2 rounded-full ${linkedJob.syncOptions.syncNotes ? 'bg-green-500' : 'bg-gray-300'} mr-1`}></div>
                            <span>Sync notes</span>
                          </div>
                          <div className="flex items-center">
                            <div className={`h-2 w-2 rounded-full ${linkedJob.syncOptions.syncStatus ? 'bg-green-500' : 'bg-gray-300'} mr-1`}></div>
                            <span>Sync status</span>
                          </div>
                          <div className="flex items-center">
                            <div className={`h-2 w-2 rounded-full ${linkedJob.syncOptions.syncAttachments ? 'bg-green-500' : 'bg-gray-300'} mr-1`}></div>
                            <span>Sync attachments</span>
                          </div>
                        </div>
                        <div className="mt-3 flex justify-end gap-2">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Link2Off className="h-4 w-4 text-red-500" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      <p className="mb-2">No linked jobs</p>
                      <Button variant="outline" size="sm">
                        <Link2 className="mr-2 h-4 w-4" />
                        Link a Job
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Historical Notes Modal */}
      <JobHistoricalNotesModal
        isOpen={isNotesModalOpen}
        onClose={() => setIsNotesModalOpen(false)}
        jobId={job.id}
        jobTitle={job.title}
        siteId={job.site.id}
        siteName={job.site.name}
      />

      {/* View All Notes Modal */}
      <ViewAllNotesModal
        isOpen={isViewAllNotesModalOpen}
        onClose={() => setIsViewAllNotesModalOpen(false)}
        jobId={job.id}
        siteId={job.site.id}
      />
    </div>
  )
} 