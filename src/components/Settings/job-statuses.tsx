import React, { useState } from "react";
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
import { Separator } from "../../components/ui/separator";
import { Badge } from "../../components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import jobService, { JobStatus, JobQueue } from "../../services/jobService";

interface JobStatusesProps {
  jobStatuses: JobStatus[];
  jobQueues: JobQueue[];
}

export default function JobStatuses({ jobStatuses, jobQueues }: JobStatusesProps) {
  const { toast } = useToast();
  const [statusName, setStatusName] = useState("");
  const [statusColor, setStatusColor] = useState("blue");
  const [selectedQueue, setSelectedQueue] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const addJobStatus = async () => {
    if (!statusName.trim()) {
      toast({
        title: "Error",
        description: "Status name is required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await jobService.createJobStatus({
        name: statusName,
        color: statusColor,
        queue: selectedQueue ? Number(selectedQueue) : undefined
      });
      
      toast({
        title: "Success",
        description: "Job status added successfully",
      });
      
      setStatusName("");
      setStatusColor("blue");
      setSelectedQueue(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add job status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteJobStatus = async (id: number) => {
    if (!confirm("Are you sure you want to delete this job status?")) return;
    
    setLoading(true);
    try {
      await jobService.deleteJobStatus(id);
      
      toast({
        title: "Success",
        description: "Job status deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete job status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Map color names to Tailwind classes
  const getColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      yellow: "bg-yellow-500",
      blue: "bg-blue-500",
      green: "bg-green-500",
      red: "bg-red-500",
      purple: "bg-purple-500",
      orange: "bg-orange-500",
      gray: "bg-gray-500"
    };
    return colorMap[color] || "bg-gray-500";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Job Statuses</CardTitle>
          <CardDescription>
            Manage the status options for jobs in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-6 gap-4">
              <div className="col-span-3">
                <Label htmlFor="status-name">Status Name</Label>
                <Input 
                  id="status-name" 
                  placeholder="Enter status name..." 
                  value={statusName}
                  onChange={(e) => setStatusName(e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="status-color">Color</Label>
                <select 
                  id="status-color" 
                  className="w-full rounded-md border px-3 py-2"
                  value={statusColor}
                  onChange={(e) => setStatusColor(e.target.value)}
                >
                  <option value="yellow">Yellow</option>
                  <option value="blue">Blue</option>
                  <option value="green">Green</option>
                  <option value="red">Red</option>
                  <option value="purple">Purple</option>
                  <option value="orange">Orange</option>
                  <option value="gray">Gray</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button className="w-full" onClick={addJobStatus} disabled={loading}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Status
                </Button>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              {loading ? (
                <div className="py-4 text-center">Loading job statuses...</div>
              ) : jobStatuses.length === 0 ? (
                <div className="py-4 text-center">No job statuses found. Create one to get started.</div>
              ) : (
                Array.isArray(jobStatuses) && jobStatuses.map(status => (
                  <div key={status.id} className="flex items-center justify-between rounded-md border p-3">
                    <div className="flex items-center gap-3">
                      <div className={`h-4 w-4 rounded-full ${getColorClass(status.color)}`}></div>
                      <span className="font-medium">{status.name}</span>
                      {status.queue && (
                        <Badge variant="outline" className="text-xs">
                          {jobQueues.find(q => q.id === status.queue)?.name || "Unknown Queue"}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => deleteJobStatus(status.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 