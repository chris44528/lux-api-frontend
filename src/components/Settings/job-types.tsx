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
import { Plus, Trash2, Edit2, X, Check } from "lucide-react";
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
  const [editingJobType, setEditingJobType] = useState<number | null>(null);
  const [editedName, setEditedName] = useState("");
  const [editedDuration, setEditedDuration] = useState("");
  const [newDuration, setNewDuration] = useState("60");

  // Load job types on component mount
  useEffect(() => {
    loadJobTypes();
  }, []);

  const loadJobTypes = async () => {
    try {
      const types = await jobService.getJobTypes();
      setJobTypes(types);
    } catch (error) {
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
        queue: selectedJobTypeQueue ? Number(selectedJobTypeQueue) : undefined,
        estimated_duration_minutes: Number(newDuration) || 60
      });
      
      toast({
        title: "Success",
        description: "Job type added successfully"
      });
      
      setNewItemName("");
      setSelectedJobTypeQueue(null);
      setNewDuration("60");
      // Refresh the job types list
      await loadJobTypes();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add job type"
      });
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (jobType: JobType) => {
    setEditingJobType(jobType.id);
    setEditedName(jobType.name);
    setEditedDuration(jobType.estimated_duration_minutes?.toString() || "60");
  };

  const cancelEditing = () => {
    setEditingJobType(null);
    setEditedName("");
    setEditedDuration("");
  };

  const saveJobType = async (id: number) => {
    setLoading(true);
    try {
      await jobService.updateJobType(id, {
        name: editedName,
        estimated_duration_minutes: Number(editedDuration) || 60
      });
      
      toast({
        title: "Success",
        description: "Job type updated successfully"
      });
      
      setEditingJobType(null);
      // Refresh the job types list
      await loadJobTypes();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update job type"
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
          <div className="grid grid-cols-5 gap-2">
            <div className="col-span-2">
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
            <div>
              <Input 
                type="number"
                placeholder="Duration (mins)" 
                value={newDuration}
                onChange={(e) => setNewDuration(e.target.value)}
                min="1"
              />
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
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Queue</th>
                      <th className="text-left p-2">Duration (mins)</th>
                      <th className="text-right p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredJobTypes.map(jobType => (
                      <tr key={jobType.id} className="border-b">
                        <td className="p-2">
                          {editingJobType === jobType.id ? (
                            <Input
                              value={editedName}
                              onChange={(e) => setEditedName(e.target.value)}
                              className="h-8"
                            />
                          ) : (
                            <span>{jobType.name}</span>
                          )}
                        </td>
                        <td className="p-2">
                          {jobType.queue ? (
                            <Badge variant="outline" className="text-xs">
                              {jobQueues.find(q => q.id === jobType.queue)?.name || "Unknown Queue"}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs bg-gray-100">
                              Global
                            </Badge>
                          )}
                        </td>
                        <td className="p-2">
                          {editingJobType === jobType.id ? (
                            <Input
                              type="number"
                              value={editedDuration}
                              onChange={(e) => setEditedDuration(e.target.value)}
                              className="h-8 w-24"
                              min="1"
                            />
                          ) : (
                            <span>{jobType.estimated_duration_minutes || 60}</span>
                          )}
                        </td>
                        <td className="p-2 text-right">
                          {editingJobType === jobType.id ? (
                            <div className="flex gap-1 justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => saveJobType(jobType.id)}
                                disabled={loading}
                              >
                                <Check className="h-4 w-4 text-green-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={cancelEditing}
                                disabled={loading}
                              >
                                <X className="h-4 w-4 text-gray-500" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex gap-1 justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => startEditing(jobType)}
                              >
                                <Edit2 className="h-4 w-4 text-blue-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => deleteJobType(jobType.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 