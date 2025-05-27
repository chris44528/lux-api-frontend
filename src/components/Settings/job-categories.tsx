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
import jobService, { JobCategory, JobQueue } from "../../services/jobService";

interface JobCategoriesProps {
  jobCategories: JobCategory[];
  jobQueues: JobQueue[];
}

export default function JobCategories({ jobCategories, jobQueues }: JobCategoriesProps) {
  const { toast } = useToast();
  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedCategoryQueue, setSelectedCategoryQueue] = useState<string | null>(null);
  const [filterCategoriesByQueue, setFilterCategoriesByQueue] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Filter categories based on selected queue
  const filteredJobCategories = jobCategories.filter(category => {
    if (!filterCategoriesByQueue) return true;
    // Convert to string for comparison since queue might be a number
    return String(category.queue) === filterCategoriesByQueue;
  });

  const addJobCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Error",
        description: "Category name is required"
      });
      return;
    }

    setLoading(true);
    try {
      await jobService.createJobCategory({
        name: newCategoryName,
        queue: selectedCategoryQueue ? Number(selectedCategoryQueue) : undefined
      });
      
      toast({
        title: "Success",
        description: "Job category added successfully"
      });
      
      setNewCategoryName("");
      setSelectedCategoryQueue(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add job category"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteJobCategory = async (id: number) => {
    if (!confirm("Are you sure you want to delete this job category?")) return;
    
    setLoading(true);
    try {
      await jobService.deleteJobCategory(id);
      
      toast({
        title: "Success",
        description: "Job category deleted successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete job category"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Job Categories</CardTitle>
        <CardDescription>
          Manage the categories of jobs in the system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Input 
                placeholder="Add new job category..." 
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
            </div>
            <div>
              <select 
                className="w-full rounded-md border px-3 py-2"
                onChange={(e) => setSelectedCategoryQueue(e.target.value === "" ? null : e.target.value)}
                value={selectedCategoryQueue || ""}
              >
                <option value="">No Queue (Global)</option>
                {jobQueues.map(queue => (
                  <option key={queue.id} value={queue.id}>{queue.name}</option>
                ))}
              </select>
            </div>
            <Button className="w-full" onClick={addJobCategory} disabled={loading}>
              <Plus className="mr-2 h-4 w-4" />
              Add
            </Button>
          </div>
          
          <div className="flex justify-between items-center">
            <Label htmlFor="filter-categories">Filter by Queue:</Label>
            <select 
              id="filter-categories"
              className="rounded-md border px-3 py-2 w-1/2"
              onChange={(e) => setFilterCategoriesByQueue(e.target.value === "" ? null : e.target.value)}
              value={filterCategoriesByQueue || ""}
            >
              <option value="">All Categories</option>
              {jobQueues.map(queue => (
                <option key={queue.id} value={queue.id}>{queue.name}</option>
              ))}
            </select>
          </div>
          
          <div className="space-y-2">
            {loading ? (
              <div className="py-4 text-center">Loading job categories...</div>
            ) : filteredJobCategories.length === 0 ? (
              <div className="py-4 text-center">No job categories found. Create one to get started.</div>
            ) : (
              filteredJobCategories.map(category => (
                <div key={category.id} className="flex items-center justify-between rounded-md border p-2">
                  <div className="flex items-center gap-2">
                    <span>{category.name}</span>
                    {category.queue ? (
                      <Badge variant="outline" className="text-xs">
                        {jobQueues.find(q => q.id === category.queue)?.name || "Unknown Queue"}
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
                    onClick={() => deleteJobCategory(category.id)}
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