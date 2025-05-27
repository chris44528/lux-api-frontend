import React, { useState } from "react";
import { useDashboard } from "../../contexts/DashboardContext";
import { Button } from "@/components/ui/button";
import { PlusCircle, Settings, Save, Loader2, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const DashboardTabs: React.FC = () => {
  const {
    state,
    switchDashboard,
    createDashboard,
    toggleEditMode,
    saveDashboard,
  } = useDashboard();
  const { dashboards, activeDashboard, isEditing } = state;
  const [newDashboardName, setNewDashboardName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Handle dashboard creation
  const handleCreateDashboard = async () => {
    if (newDashboardName.trim()) {
      setIsCreating(true);
      try {
        createDashboard(newDashboardName);
        await saveDashboard(); // Save to backend immediately
        setNewDashboardName("");
        setIsDialogOpen(false);
      } catch (error) {
      } finally {
        setIsCreating(false);
      }
    }
  };

  // Handle dashboard switch
  const handleSwitchDashboard = (id: string) => {
    switchDashboard(id);
  };

  // Handle save dashboard
  const handleSaveDashboard = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await saveDashboard();
      setSaveSuccess(true);
      // Reset success state after 2 seconds
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex items-center justify-between border-b dark:border-gray-700 pb-4 mb-6">
      <div className="flex items-center space-x-2 overflow-x-auto">
        {dashboards.map((dashboard) => (
          <Button
            key={dashboard.id}
            variant={dashboard.id === activeDashboard ? "default" : "outline"}
            onClick={() => handleSwitchDashboard(dashboard.id)}
            className="whitespace-nowrap"
          >
            {dashboard.name}
          </Button>
        ))}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2 text-sm">
              <PlusCircle className="h-4 w-4" />
              New Dashboard
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Dashboard</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="dashboard-name">Dashboard Name</Label>
              <Input
                id="dashboard-name"
                value={newDashboardName}
                onChange={(e) => setNewDashboardName(e.target.value)}
                placeholder="Enter dashboard name"
                className="mt-2"
              />
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateDashboard}
                disabled={isCreating || !newDashboardName.trim()}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        {isEditing ? (
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleSaveDashboard}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : saveSuccess ? (
              <>
                <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                Saved!
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save
              </>
            )}
          </Button>
        ) : null}
        <Button
          variant={isEditing ? "default" : "outline"}
          className="flex items-center gap-2"
          onClick={toggleEditMode}
        >
          <Settings className="h-4 w-4" />
          {isEditing ? "Done Editing" : "Edit Dashboard"}
        </Button>
      </div>
    </div>
  );
};
