import React, { useState } from "react";
import { useDashboard } from "../../contexts/DashboardContext";
import { Button } from "@/components/ui/button";
import { PlusCircle, Settings, Save, Loader2, Check, X, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const DashboardTabs: React.FC = () => {
  const {
    state,
    switchDashboard,
    createDashboard,
    removeDashboard,
    toggleEditMode,
    saveDashboard,
  } = useDashboard();
  const { dashboards, activeDashboard, isEditing } = state;
  const [newDashboardName, setNewDashboardName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [dashboardToDelete, setDashboardToDelete] = useState<string | null>(null);

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

  // Handle delete dashboard
  const handleDeleteDashboard = async () => {
    if (dashboardToDelete) {
      removeDashboard(dashboardToDelete);
      await saveDashboard();
      setDeleteConfirmOpen(false);
      setDashboardToDelete(null);
    }
  };

  return (
    <div className="flex items-center justify-between border-b dark:border-gray-700 pb-4 mb-6">
      <div className="flex items-center space-x-2 overflow-x-auto">
        {dashboards.map((dashboard) => (
          <div key={dashboard.id} className="relative group">
            <Button
              variant={dashboard.id === activeDashboard ? "default" : "outline"}
              onClick={() => handleSwitchDashboard(dashboard.id)}
              className="whitespace-nowrap pr-8"
            >
              {dashboard.name}
              {dashboard.isDefault && (
                <span className="ml-2 text-xs opacity-70">(Default)</span>
              )}
            </Button>
            {!dashboard.isDefault && isEditing && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 bottom-0 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  setDashboardToDelete(dashboard.id);
                  setDeleteConfirmOpen(true);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
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
          onClick={async () => {
            if (isEditing) {
              await handleSaveDashboard();
            }
            toggleEditMode();
          }}
        >
          <Settings className="h-4 w-4" />
          {isEditing ? "Done Editing" : "Edit Dashboard"}
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Dashboard</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this dashboard? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setDashboardToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteDashboard}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
