"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { DashboardHeader } from "../../components/JobManagement/dashboard-header"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "../../components/ui/popover"
import { CheckIcon, ChevronDown } from "lucide-react"
import { useToast } from "../../hooks/use-toast"
import jobService, { JobStatus, JobQueue, TaskTemplate, JobCreate } from "../../services/jobService"
import { searchSites } from "../../services/api"
import api from "../../services/api"

// Define a more comprehensive site type
interface SiteDetails {
  site_id: number
  site_name: string
  postcode: string
  address: string
  email?: string
  phone?: string
  mobile?: string
  owner?: string
  fit_id?: string
  region?: string
}

const priorities = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
]

interface FormData {
  title: string;
  description: string;
  site_id: string;
  priority: 'low' | 'medium' | 'high';
  status_id: string;
  queue_id: string;
  due_date: string;
  type_id?: string;
  category_id?: string;
}

export default function JobCreatePage() {
  const [loading, setLoading] = useState(false)
  const [statuses, setStatuses] = useState<JobStatus[]>([])
  const [queues, setQueues] = useState<JobQueue[]>([])
  const [taskTemplates, setTaskTemplates] = useState<TaskTemplate[]>([])
  const [sites, setSites] = useState<SiteDetails[]>([])
  const [siteSearchTerm, setSiteSearchTerm] = useState("")
  const [isSearchingSites, setIsSearchingSites] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [selectedTemplates, setSelectedTemplates] = useState<number[]>([])
  const [selectedSite, setSelectedSite] = useState<SiteDetails | null>(null)
  const [isLoadingSiteDetails, setIsLoadingSiteDetails] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    site_id: "",
    priority: "medium",
    status_id: "",
    queue_id: "",
    due_date: new Date().toISOString().split('T')[0],
    type_id: undefined,
    category_id: undefined
  })
  
  const { toast } = useToast()
  const navigate = useNavigate()
  
  useEffect(() => {
    const fetchFormData = async () => {
      setLoading(true)
      try {
        // Fetch all the necessary data for the form
        const [statusesData, queuesData, templatesData] = await Promise.all([
          jobService.getJobStatuses(),
          jobService.getJobQueues(),
          jobService.getTaskTemplates()
        ])
        
        setStatuses(statusesData)
        setQueues(queuesData)
        setTaskTemplates(templatesData)
        
        // Set default selections if available
        if (statusesData.length > 0) {
          const defaultStatus = statusesData.find(s => s.is_default) || statusesData[0]
          setFormData(prev => ({ ...prev, status_id: defaultStatus.id.toString() }))
        }
        
        if (queuesData.length > 0) {
          setFormData(prev => ({ ...prev, queue_id: queuesData[0].id.toString() }))
        }
      } catch (error) {
        console.error("Error fetching form data:", error)
        toast({
          title: "Error",
          description: "Failed to load form data. Please try again."
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchFormData()
  }, [])
  
  // Handle site search
  useEffect(() => {
    if (!siteSearchTerm || siteSearchTerm.length < 2) {
      // Only clear sites if we're not already displaying a selected site
      if (!selectedSite) {
        setSites([])
      }
      return
    }
    
    const searchSitesData = async () => {
      setIsSearchingSites(true)
      try {
        // Use the proper API to search for sites
        // Log the search term for debugging
        console.log("Searching sites with term:", siteSearchTerm);
        
        const response = await searchSites(siteSearchTerm)
        console.log("Site search response:", response);
        
        if (response && response.results && response.results.length > 0) {
          console.log("Found sites count:", response.results.length);
          
          // Transform the response to match our SiteDetails interface
          // Fix lint error by using Record<string, any> instead of any
          const transformedSites = response.results.map((site: Record<string, unknown>) => {
            // Log individual site data for debugging
            console.log("Site data from API:", JSON.stringify(site, null, 2));
            
            // Extract site properties safely to avoid undefined errors
            const siteData: SiteDetails = {
              site_id: typeof site.site_id === 'number' ? site.site_id : 0,
              site_name: typeof site.site_name === 'string' ? site.site_name : '',
              postcode: typeof site.postcode === 'string' ? site.postcode : '',
              address: typeof site.address === 'string' ? site.address : '',
              fit_id: typeof site.fit_id === 'string' ? site.fit_id : '',
              region: typeof site.region === 'string' ? site.region : ''
            }
            
            console.log("Transformed site data:", siteData);
            return siteData;
          });
          
          console.log("All transformed sites:", transformedSites);
          setSites(transformedSites)
        } else {
          console.log("No site results found");
          setSites([])
        }
      } catch (error) {
        console.error("Error searching sites:", error)
        // Clear sites on error - no fallback to mock data
        setSites([])
      } finally {
        setIsSearchingSites(false)
      }
    }
    
    const timeoutId = setTimeout(searchSitesData, 500)
    return () => clearTimeout(timeoutId)
  }, [siteSearchTerm, selectedSite])
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  const handleSiteSelect = (siteId: string) => {
    console.log(`handleSiteSelect called with siteId: ${siteId}`);
    console.log(`Available sites:`, sites);
    
    const site = sites.find(site => site.site_id.toString() === siteId);
    console.log(`Found site:`, site);
    
    if (site) {
      // Update the selected site state
      setSelectedSite(site);
      console.log(`Selected site set to:`, site);
      
      // Update the form data
      setFormData(prev => {
        const newFormData = { ...prev, site_id: siteId };
        console.log(`Form data updated:`, newFormData);
        return newFormData;
      });
      
      // Try to fetch additional customer details if not already present
      if (!site.email || !site.phone || !site.mobile || !site.owner) {
        console.log(`Fetching additional details for site ${siteId}`);
        fetchSiteDetails(site.site_id);
      } else {
        console.log(`Site already has customer details, skipping fetch`);
      }
      
      // Close dropdown by clearing search term
      setSiteSearchTerm("");
    } else {
      console.error(`Could not find site with ID ${siteId} in the current sites list`);
    }
  }
  
  // Function to fetch additional site and customer details
  const fetchSiteDetails = async (siteId: number) => {
    setIsLoadingSiteDetails(true)
    try {
      console.log("Fetching details for site ID:", siteId);
      
      // Make API call to get site details including customer info
      const response = await api.get(`/site-detail/${siteId}/`);
      console.log("Site details response:", response.data);
      
      if (response.data) {
        // Handle different API response structures
        const siteData = response.data.site || response.data;
        const customerData = response.data.customer;
        
        console.log("Site data from API:", siteData);
        console.log("Customer data from API:", customerData);
        
        // Update the selectedSite with full details
        const updatedSite: SiteDetails = {
          ...selectedSite!,
          site_id: siteId,
          site_name: siteData?.site_name || selectedSite?.site_name || '',
          address: siteData?.address || selectedSite?.address || '',
          postcode: siteData?.postcode || selectedSite?.postcode || '',
          fit_id: siteData?.fit_id || '',
          region: siteData?.region || '',
        };
        
        // Add customer details if available
        if (customerData) {
          updatedSite.owner = customerData.owner || '';
          updatedSite.phone = customerData.phone || '';
          updatedSite.mobile = customerData.mobile || '';
          updatedSite.email = customerData.email || '';
        }
        
        console.log("Updated site details:", updatedSite);
        setSelectedSite(updatedSite);
        
        // Also update the site in the sites array
        setSites(prevSites => 
          prevSites.map(s => 
            s.site_id === siteId ? updatedSite : s
          )
        );
      }
    } catch (error) {
      console.error("Error fetching site details:", error);
      // Silently fail - we already have basic site details
    } finally {
      setIsLoadingSiteDetails(false);
    }
  }
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value)
    setFormData(prev => ({ ...prev, due_date: e.target.value }))
  }
  
  const toggleTaskTemplate = (id: number) => {
    setSelectedTemplates(prev => {
      if (prev.includes(id)) {
        return prev.filter(templateId => templateId !== id)
      } else {
        return [...prev, id]
      }
    })
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.site_id) {
      toast({
        title: "Missing Information",
        description: "Please select a site for this job"
      })
      return
    }
    
    if (!formData.title) {
      toast({
        title: "Missing Information",
        description: "Please provide a title for this job"
      })
      return
    }
    
    setLoading(true)
    
    try {
      // Find the selected site to get its full information
      const selectedSite = sites.find(site => site.site_id.toString() === formData.site_id)
      
      // Find selected status and queue objects
      const selectedStatus = statuses.find(s => s.id.toString() === formData.status_id);
      const selectedQueue = queues.find(q => q.id.toString() === formData.queue_id);
      const selectedType = taskTemplates.find(t => t.id.toString() === formData.type_id);
      
      console.log("Creating job with data:", {
        site: selectedSite,
        status: selectedStatus,
        queue: selectedQueue,
        type: selectedType,
        formData
      });
      
      // Create the job - use the correct ID format for Django foreign keys and the correct field names
      const newJobData: JobCreate = {
        title: formData.title,
        description: formData.description,
        site_id: parseInt(formData.site_id), // Use site_id instead of site
        client: selectedSite?.owner || "Unknown",
        address: selectedSite?.address || "Unknown",
        priority: formData.priority,
        status_id: parseInt(formData.status_id), // Use status_id instead of status
        queue_id: parseInt(formData.queue_id), // Use queue_id instead of queue
        type_id: formData.type_id ? parseInt(formData.type_id) : null, // Use type_id instead of type
        category_id: formData.category_id ? parseInt(formData.category_id) : null, // Use category_id instead of category
        due_date: formData.due_date
      }
      
      // Send job data to the backend to create the job
      const createdJob = await jobService.createJob(newJobData)
      
      // Assign selected task templates if any
      if (selectedTemplates.length > 0) {
        await Promise.all(
          selectedTemplates.map(templateId => 
            jobService.assignTaskTemplate(createdJob.id, templateId)
          )
        )
      }
      
      toast({
        title: "Job Created",
        description: "The job has been created successfully"
      })
      
      // Redirect to the job details page
      navigate(`/jobs/${createdJob.id}`)
    } catch (error) {
      console.error("Error creating job:", error)
      toast({
        title: "Error",
        description: "Failed to create job. Please try again."
      })
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="flex flex-col h-full min-h-screen">
      <DashboardHeader />
      <main className="flex-1 p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Create New Job</h1>
            <p className="text-muted-foreground">
              Fill in the details to create a new job
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
          >
            Cancel
          </Button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Job Information</CardTitle>
              <p className="text-sm text-muted-foreground">
                Enter the basic information for this job
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Job Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter job title"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="site">Site *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        {formData.site_id
                          ? sites.find(site => site.site_id.toString() === formData.site_id)?.site_name || "Select site"
                          : "Select site"}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent 
                      className="w-[400px] p-0 max-h-[500px] overflow-auto" 
                      align="start"
                      sideOffset={5}
                    >
                      <div className="p-2">
                        <div className="flex items-center border rounded-md px-3 py-2 mb-2">
                          <input
                            value={siteSearchTerm}
                            onChange={e => setSiteSearchTerm(e.target.value)}
                            placeholder="Search by site name, postcode or address..."
                            className="flex-1 bg-transparent outline-none"
                          />
                          {siteSearchTerm && (
                            <button
                              onClick={() => setSiteSearchTerm("")}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                        
                        {/* Loading indicator */}
                        {isSearchingSites && (
                          <div className="py-6 text-center text-sm">
                            <div className="flex items-center justify-center">
                              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Searching...
                            </div>
                          </div>
                        )}
                        
                        {/* No results message */}
                        {!isSearchingSites && sites.length === 0 && siteSearchTerm && siteSearchTerm.length >= 2 && (
                          <div className="py-6 text-center text-sm">
                            <p className="text-gray-500 mb-2">No sites found.</p>
                            <div className="text-xs text-gray-400">
                              <p>Try searching for:</p>
                              <ul className="mt-1 space-y-1">
                                <li>• Site name (e.g., "Smith Residence")</li>
                                <li>• Postcode (e.g., "AB12 3CD")</li>
                                <li>• Address (e.g., "High Street")</li>
                              </ul>
                            </div>
                          </div>
                        )}
                        
                        {/* Minimum search length guidance */}
                        {siteSearchTerm && siteSearchTerm.length < 2 && (
                          <div className="py-6 text-center text-sm">
                            <p className="text-gray-500">Enter at least 2 characters to search.</p>
                            <p className="text-xs text-gray-400 mt-1">
                              You can search by site name, postcode, or address
                            </p>
                          </div>
                        )}
                        
                        {/* Empty state guidance */}
                        {!siteSearchTerm && (
                          <div className="py-6 text-center text-sm">
                            <p className="text-gray-500">
                              Start typing to search for sites.
                            </p>
                          </div>
                        )}
                        
                        {/* Site results list */}
                        {sites.length > 0 && (
                          <div className="overflow-y-auto max-h-[300px]">
                            <div className="text-xs font-medium text-gray-500 mb-1 px-1">
                              Site Results ({sites.length})
                            </div>
                            <div className="space-y-1">
                              {sites.map(site => (
                                <button
                                  key={site.site_id}
                                  type="button"
                                  className={`w-full text-left px-2 py-2 rounded hover:bg-blue-50 ${
                                    formData.site_id === site.site_id.toString() ? 'bg-blue-50 border-blue-400' : ''
                                  }`}
                                  onClick={() => {
                                    console.log("Site button clicked:", site);
                                    handleSiteSelect(site.site_id.toString());
                                  }}
                                >
                                  <div className="font-medium">{site.site_name}</div>
                                  <div className="text-xs text-gray-500">
                                    {site.postcode} - {site.address || 'No address'}
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              {/* Site details section - only show when a site is selected */}
              {selectedSite && (
                <Card className="border border-blue-100 bg-blue-50">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium">Site Details:</h3>
                      {isLoadingSiteDetails && (
                        <div className="flex items-center text-xs text-blue-600">
                          <svg className="animate-spin -ml-1 mr-2 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Loading details...
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="font-semibold">Address:</p>
                        <p className="text-gray-600">{selectedSite.address}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Postcode:</p>
                        <p className="text-gray-600">{selectedSite.postcode}</p>
                      </div>
                      {selectedSite.fit_id && (
                        <div>
                          <p className="font-semibold">FIT ID:</p>
                          <p className="text-gray-600">{selectedSite.fit_id}</p>
                        </div>
                      )}
                      {selectedSite.region && (
                        <div>
                          <p className="font-semibold">Region:</p>
                          <p className="text-gray-600">{selectedSite.region}</p>
                        </div>
                      )}
                      {selectedSite.owner && (
                        <div>
                          <p className="font-semibold">Owner:</p>
                          <p className="text-gray-600">{selectedSite.owner}</p>
                        </div>
                      )}
                      {selectedSite.email && (
                        <div>
                          <p className="font-semibold">Email:</p>
                          <p className="text-gray-600">{selectedSite.email}</p>
                        </div>
                      )}
                      {selectedSite.phone && (
                        <div>
                          <p className="font-semibold">Phone:</p>
                          <p className="text-gray-600">{selectedSite.phone}</p>
                        </div>
                      )}
                      {selectedSite.mobile && (
                        <div>
                          <p className="font-semibold">Mobile:</p>
                          <p className="text-gray-600">{selectedSite.mobile}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter job description"
                  className="h-24"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <select
                    id="priority"
                    name="priority"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={formData.priority}
                    onChange={handleInputChange}
                  >
                    {priorities.map((priority) => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status_id">Status</Label>
                  <select
                    id="status_id"
                    name="status_id"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={formData.status_id}
                    onChange={handleInputChange}
                  >
                    {Array.isArray(statuses) ? statuses.map((status) => (
                      <option key={status.id} value={status.id.toString()}>
                        {status.name}
                      </option>
                    )) : <option value="">No statuses available</option>}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="queue_id">Queue</Label>
                  <select
                    id="queue_id"
                    name="queue_id"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={formData.queue_id}
                    onChange={handleInputChange}
                  >
                    {Array.isArray(queues) ? queues.map((queue) => (
                      <option key={queue.id} value={queue.id.toString()}>
                        {queue.name}
                      </option>
                    )) : <option value="">No queues available</option>}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    name="due_date"
                    type="date"
                    value={selectedDate}
                    onChange={handleDateChange}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Task Templates</CardTitle>
              <p className="text-sm text-muted-foreground">
                Select task templates to assign to this job
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {!Array.isArray(taskTemplates) || taskTemplates.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No task templates available
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {taskTemplates.map(template => (
                      <div
                        key={template.id}
                        className={`border rounded-md p-4 cursor-pointer hover:bg-gray-100 transition-colors ${
                          selectedTemplates.includes(template.id) ? 'border-blue-500 bg-blue-50' : ''
                        }`}
                        onClick={() => toggleTaskTemplate(template.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{template.name}</h4>
                            <p className="text-sm text-muted-foreground">{template.description}</p>
                            <div className="mt-2 text-xs">
                              <span className="font-medium">Type:</span> {template.job_type.name}
                            </div>
                            <div className="mt-1 text-xs">
                              <span className="font-medium">Steps:</span> {template.steps.length}
                            </div>
                          </div>
                          <div className={`w-5 h-5 border rounded-full flex items-center justify-center ${
                            selectedTemplates.includes(template.id) 
                              ? 'bg-blue-500 border-blue-500' 
                              : 'border-gray-300'
                          }`}>
                            {selectedTemplates.includes(template.id) && (
                              <CheckIcon className="h-3 w-3 text-white" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end space-x-4 px-6 py-4 bg-gray-50 rounded-md">
            <Button 
              variant="outline" 
              onClick={() => navigate(-1)}
              disabled={loading}
              type="button"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Job"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
} 