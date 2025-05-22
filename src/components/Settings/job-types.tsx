import React, { useState, useEffect } from "react";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import jobService, { JobType, JobQueue } from "../../services/jobService";

interface JobTypesProps {
  jobQueues: JobQueue[];
}

export default function JobTypes({ jobQueues }: JobTypesProps) {
  const { toast } = useToast();
  const [jobTypes, setJobTypes] = useState<JobType[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [selectedJobTypeQueue, setSelectedJobTypeQueue] = useState<string | null>(null);
  const [filterJobTypesByQueue, setFilterJobTypesByQueue] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load job types on component mount
  useEffect(() => {
    loadJobTypes();
  }, []);

  const loadJobTypes = async () => {
    try {
      const types = await jobService.getJobTypes();
      setJobTypes(types);
    } catch (error) {
      console.error("Error loading job types:", error);
      toast({
        title: "Error",
        description: "Failed to load job types"
      });
    }
  };

  // Filter job types based on selected queue
  const filteredJobTypes = jobTypes.filter(type => {
    if (!filterJobTypesByQueue) return true;
    // Convert to string for comparison since queue might be a number
    return String(type.queue) === filterJobTypesByQueue;
  });

  const addJobType = async () => {
    if (!newItemName.trim()) {
      toast({
        title: "Error",
        description: "Job type name is required"
      });
      return;
    }

    setLoading(true);
    try {
      await jobService.createJobType({
        name: newItemName,
        queue: selectedJobTypeQueue ? Number(selectedJobTypeQueue) : undefined
      });
      
      toast({
        title: "Success",
        description: "Job type added successfully"
      });
      
      setNewItemName("");
      setSelectedJobTypeQueue(null);
      // Refresh the job types list
      await loadJobTypes();
    } catch (error) {
      console.error("Error adding job type:", error);
      toast({
        title: "Error",
        description: "Failed to add job type"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteJobType = async (id: number) => {
    if (!confirm("Are you sure you want to delete this job type?")) return;
    
    setLoading(true);
    try {
      await jobService.deleteJobType(id);
      
      toast({
        title: "Success",
        description: "Job type deleted successfully"
      });
      // Refresh the job types list
      await loadJobTypes();
    } catch (error) {
      console.error("Error deleting job type:", error);
      toast({
        title: "Error",
        description: "Failed to delete job type"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Job Types</CardTitle>
        <CardDescription>
          Manage the types of jobs in the system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Input 
                placeholder="Add new job type..." 
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
              />
            </div>
            <div>
              <select 
                className="w-full rounded-md border px-3 py-2"
                onChange={(e) => setSelectedJobTypeQueue(e.target.value === "" ? null : e.target.value)}
                value={selectedJobTypeQueue || ""}
              >
                <option value="">No Queue (Global)</option>
                {jobQueues.map(queue => (
                  <option key={queue.id} value={queue.id}>{queue.name}</option>
                ))}
              </select>
            </div>
            <Button className="w-full" onClick={addJobType} disabled={loading}>
              <Plus className="mr-2 h-4 w-4" />
              Add
            </Button>
          </div>
          
          <div className="flex justify-between items-center">
            <Label htmlFor="filter-job-types">Filter by Queue:</Label>
            <select 
              id="filter-job-types"
              className="rounded-md border px-3 py-2 w-1/2"
              onChange={(e) => setFilterJobTypesByQueue(e.target.value === "" ? null : e.target.value)}
              value={filterJobTypesByQueue || ""}
            >
              <option value="">All Job Types</option>
              {jobQueues.map(queue => (
                <option key={queue.id} value={queue.id}>{queue.name}</option>
              ))}
            </select>
          </div>
          
          <div className="space-y-2">
            {loading ? (
              <div className="py-4 text-center">Loading job types...</div>
            ) : filteredJobTypes.length === 0 ? (
              <div className="py-4 text-center">No job types found. Create one to get started.</div>
            ) : (
              filteredJobTypes.map(jobType => (
                <div key={jobType.id} className="flex items-center justify-between rounded-md border p-2">
                  <div className="flex items-center gap-2">
                    <span>{jobType.name}</span>
                    {jobType.queue ? (
                      <Badge variant="outline" className="text-xs">
                        {jobQueues.find(q => q.id === jobType.queue)?.name || "Unknown Queue"}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs bg-gray-100">
                        Global
                      </Badge>
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={() => deleteJobType(jobType.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 