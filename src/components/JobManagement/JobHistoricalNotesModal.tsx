import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import jobService from "../../services/jobService";


// Simple toast implementation
const useToast = () => {
  const toast = (options: { title?: string; description?: string }) => {
    // Toast notification placeholder
  };
  return { toast };
};

// Define interfaces for different note types
interface BaseNote {
  id: number;
  content: string;
  created_at: string;
  created_by: {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
  };
}

interface JobNote extends BaseNote {
  type: 'job';
  job_title?: string;
  is_current_job: boolean;
}

interface StepNote extends BaseNote {
  type: 'step';
  step_name: string;
  option_selected?: string;
  job_title?: string;
  is_current_job: boolean;
}

interface SiteNote extends BaseNote {
  type: 'site';
}

// Union type for all notes
type Note = JobNote | StepNote | SiteNote;

interface JobHistoricalNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string | number;
  jobTitle: string;
  siteId: number;
  siteName: string;
}

export function JobHistoricalNotesModal({
  isOpen,
  onClose,
  jobId,
  jobTitle,
  siteId,
  siteName
}: JobHistoricalNotesModalProps) {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [newNote, setNewNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Fetch all notes when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAllNotes();
    }
  }, [isOpen, jobId, siteId]);

  // Filter notes based on tab and search term
  useEffect(() => {
    let filtered = notes;
    
    // Apply tab filter
    if (activeTab === "current") {
      filtered = notes.filter(note => 
        (note.type === 'job' || note.type === 'step') && 
        (note as JobNote | StepNote).is_current_job
      );
    } else if (activeTab === "historical") {
      filtered = notes.filter(note => 
        (note.type === 'job' || note.type === 'step') && 
        !(note as JobNote | StepNote).is_current_job
      );
    } else if (activeTab !== "all") {
      filtered = notes.filter(note => note.type === activeTab);
    }
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(note => {
        // Search in content
        if (note.content.toLowerCase().includes(term)) return true;
        
        // Search in author name
        const author = `${note.created_by.first_name} ${note.created_by.last_name}`.toLowerCase();
        if (author.includes(term)) return true;
        
        // Search in step name for step notes
        if (note.type === 'step' && (note as StepNote).step_name.toLowerCase().includes(term)) return true;
        
        // Search in job title for job or step notes
        if ((note.type === 'job' || note.type === 'step') && 
            (note as JobNote | StepNote).job_title && 
            (note as JobNote | StepNote).job_title?.toLowerCase().includes(term)) {
          return true;
        }
        
        return false;
      });
    }
    
    setFilteredNotes(filtered);
  }, [notes, activeTab, searchTerm]);

  // Function to fetch all types of notes
  const fetchAllNotes = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Start with an empty array
      const allNotes: Note[] = [];
      
      // Fetch current job notes
      try {
        const jobNotes = await jobService.getJobNotes(jobId);
        allNotes.push(...jobNotes.map(note => ({
          ...note,
          type: 'job' as const,
          job_title: jobTitle,
          is_current_job: true
        })));
      } catch (err) {
      }
      
      // Fetch current job step notes
      try {
        const stepNotes = await jobService.getJobStepNotes(jobId);
        if (stepNotes && Array.isArray(stepNotes)) {
          allNotes.push(...stepNotes.map(note => ({
            ...note,
            type: 'step' as const,
            job_title: jobTitle,
            is_current_job: true
          })));
        }
      } catch (err) {
      }
      
      // Fetch site notes
      try {
        if (siteId) {
          const siteNotes = await jobService.getSiteNotes(siteId);
          if (siteNotes && Array.isArray(siteNotes)) {
            allNotes.push(...siteNotes.map(note => ({
              ...note,
              type: 'site' as const
            })));
          }
        }
      } catch (err) {
      }
      
      // Fetch historical job notes for this site
      try {
        if (siteId) {
          const historicalNotes = await jobService.getHistoricalJobNotes(siteId, jobId);
          if (historicalNotes && Array.isArray(historicalNotes)) {
            // Historical notes include both job notes and step notes
            allNotes.push(...historicalNotes.map(note => {
              if (note.step_name) {
                return {
                  ...note,
                  type: 'step' as const,
                  is_current_job: false
                };
              } else {
                return {
                  ...note,
                  type: 'job' as const,
                  is_current_job: false
                };
              }
            }));
          }
        }
      } catch (err) {
      }
      
      // Sort all notes by date (newest first)
      allNotes.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      setNotes(allNotes);
    } catch (err) {
      setError("Failed to load notes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Function to add a new note
  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast({
        title: "Error",
        description: "Please enter a note"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const addedNote = await jobService.addJobNote(jobId, newNote);
      
      // Add the new note to the top of the list
      setNotes(prevNotes => [
        {
          ...addedNote,
          type: 'job' as const,
          job_title: jobTitle,
          is_current_job: true
        },
        ...prevNotes
      ]);
      
      // Clear the input
      setNewNote("");
      
      toast({
        title: "Success",
        description: "Note added successfully"
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to add note. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Function to get note type label
  const getNoteTypeLabel = (note: Note) => {
    switch (note.type) {
      case 'job':
        const jobNote = note as JobNote;
        return jobNote.is_current_job 
          ? "Job Note" 
          : `Historical Note: ${jobNote.job_title || 'Unknown Job'}`;
      case 'step':
        const stepNote = note as StepNote;
        return stepNote.is_current_job 
          ? `Step: ${stepNote.step_name}` 
          : `Historical Step: ${stepNote.step_name} (${stepNote.job_title || 'Unknown Job'})`;
      case 'site':
        return `Site Note: ${siteName}`;
      default:
        return "Note";
    }
  };

  // Function to get note type badge color
  const getNoteTypeBadgeClass = (note: Note) => {
    switch (note.type) {
      case 'job':
        return (note as JobNote).is_current_job 
          ? "bg-blue-100 text-blue-800" 
          : "bg-amber-100 text-amber-800";
      case 'step':
        return (note as StepNote).is_current_job 
          ? "bg-green-100 text-green-800" 
          : "bg-teal-100 text-teal-800";
      case 'site':
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        onClose();
      }}
    >
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>All Notes</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Search and filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
            <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="all" className="w-full sm:w-auto">
              <TabsList className="grid grid-cols-5">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="current">Current</TabsTrigger>
                <TabsTrigger value="historical">History</TabsTrigger>
                <TabsTrigger value="site">Site</TabsTrigger>
                <TabsTrigger value="step">Steps</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {/* Notes list */}
          <div className="overflow-y-auto flex-1 border rounded-md">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading notes...</div>
            ) : error ? (
              <div className="p-4 text-center text-red-500">{error}</div>
            ) : filteredNotes.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No notes found</div>
            ) : (
              <div className="divide-y">
                {filteredNotes.map((note) => (
                  <div key={`${note.type}-${note.id}`} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                          {note.created_by.first_name?.[0] || note.created_by.username?.[0] || '?'}
                        </div>
                        <div>
                          <div className="font-medium">
                            {note.created_by.first_name} {note.created_by.last_name || ''}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(note.created_at)}
                          </div>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${getNoteTypeBadgeClass(note)}`}>
                        {getNoteTypeLabel(note)}
                      </span>
                    </div>
                    
                    <div className="mt-2">
                      <p className="whitespace-pre-wrap">{note.content}</p>
                      
                      {/* Show selected option for step notes */}
                      {note.type === 'step' && (note as StepNote).option_selected && (
                        <div className="mt-1 bg-gray-50 p-2 rounded text-sm">
                          <span className="font-medium">Selected option:</span> {(note as StepNote).option_selected}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Add note form */}
          <div className="space-y-2">
            <div className="font-medium">Add New Note</div>
            <Textarea
              placeholder="Type your note here..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end">
              <Button onClick={handleAddNote} disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Note"}
              </Button>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 