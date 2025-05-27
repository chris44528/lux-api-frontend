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
import { Badge } from "../../components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import jobService, { JobTag, JobQueue } from "../../services/jobService";

interface JobTagsProps {
  jobTags: JobTag[];
  jobQueues: JobQueue[];
}

export default function JobTags({ jobTags, jobQueues }: JobTagsProps) {
  const { toast } = useToast();
  const [newTagName, setNewTagName] = useState("");
  const [selectedTagQueue, setSelectedTagQueue] = useState<string | null>(null);
  const [filterTagsByQueue, setFilterTagsByQueue] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Filter tags based on selected queue
  const filteredTags = jobTags.filter(tag => {
    if (!filterTagsByQueue) return true;
    // Convert to string for comparison since queue might be a number
    return String(tag.queue) === filterTagsByQueue;
  });

  const addTag = async () => {
    if (!newTagName.trim()) {
      toast({
        title: "Error",
        description: "Tag name is required"
      });
      return;
    }

    setLoading(true);
    try {
      await jobService.createJobTag({
        name: newTagName,
        queue: selectedTagQueue ? Number(selectedTagQueue) : undefined
      });
      
      toast({
        title: "Success",
        description: "Tag added successfully"
      });
      
      setNewTagName("");
      setSelectedTagQueue(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add tag"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteJobTag = async (id: number) => {
    if (!confirm("Are you sure you want to delete this tag?")) return;
    
    setLoading(true);
    try {
      await jobService.deleteJobTag(id);
      
      toast({
        title: "Success",
        description: "Tag deleted successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete tag"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tags</CardTitle>
        <CardDescription>
          Manage tags for categorizing jobs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Input 
                placeholder="Add new tag..." 
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
              />
            </div>
            <div>
              <select 
                className="w-full rounded-md border px-3 py-2"
                onChange={(e) => setSelectedTagQueue(e.target.value === "" ? null : e.target.value)}
                value={selectedTagQueue || ""}
              >
                <option value="">No Queue (Global)</option>
                {jobQueues.map(queue => (
                  <option key={queue.id} value={queue.id}>{queue.name}</option>
                ))}
              </select>
            </div>
            <Button className="w-full" onClick={addTag} disabled={loading}>
              <Plus className="mr-2 h-4 w-4" />
              Add
            </Button>
          </div>
          
          <div className="flex justify-between items-center">
            <Label htmlFor="filter-tags">Filter by Queue:</Label>
            <select 
              id="filter-tags"
              className="rounded-md border px-3 py-2 w-1/2"
              onChange={(e) => setFilterTagsByQueue(e.target.value === "" ? null : e.target.value)}
              value={filterTagsByQueue || ""}
            >
              <option value="">All Tags</option>
              {jobQueues.map(queue => (
                <option key={queue.id} value={queue.id}>{queue.name}</option>
              ))}
            </select>
          </div>
          
          <div className="space-y-2">
            {loading ? (
              <div className="py-4 text-center">Loading tags...</div>
            ) : filteredTags.length === 0 ? (
              <div className="py-4 text-center">No tags found. Create one to get started.</div>
            ) : (
              filteredTags.map(tag => (
                <div key={tag.id} className="flex items-center justify-between rounded-md border p-2">
                  <div className="flex items-center gap-2">
                    <Badge>{tag.name}</Badge>
                    {tag.queue ? (
                      <Badge variant="outline" className="text-xs">
                        {jobQueues.find(q => q.id === tag.queue)?.name || "Unknown Queue"}
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
                    onClick={() => deleteJobTag(tag.id)}
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