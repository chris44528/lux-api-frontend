import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import jobService from "../../services/jobService";
import { useToast } from "../../hooks/use-toast";

// Define interfaces for different note types
interface JobNote {
  id: string | number;
  content: string;
  created_at: string;
  created_by: {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
  };
  type: 'job';
  job?: number; // Add optional job property
}

interface StepNote {
  id: string | number;
  step_name: string;
  content: string;
  created_at: string;
  created_by: {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
  };
  option_selected?: string;
  type: 'step';
}

interface SiteNote {
  id: string | number;
  content: string;
  created_at: string;
  created_by: {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
  };
  type: 'site';
}

// Union type for all notes
type Note = JobNote | StepNote | SiteNote;

interface ViewAllNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  siteId: number;
}

export function ViewAllNotesModal({
  isOpen,
  onClose,
  jobId,
  siteId
}: ViewAllNotesModalProps) {
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
    if (activeTab !== "all") {
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
      // Use the new consolidated method to get all site notes in one call
      const siteNotes = await jobService.getAllSiteNotes(jobId);
      console.log("All site notes response:", siteNotes);
      
      // Convert to our component's Note format
      const allNotes: Note[] = siteNotes.map(note => {
        // Determine the note type based on the source field
        let noteType: 'job' | 'step' | 'site' = 'site';
        if (note.source === 'job') noteType = 'job';
        else if (note.source === 'step') noteType = 'step';
        
        // Base note object that works for all types
        const baseNote = {
          id: note.id.toString(),
          content: note.content,
          created_at: note.created_at,
          created_by: note.created_by || {
            id: 0,
            first_name: note.note_author?.split(' ')[0] || 'System',
            last_name: note.note_author?.split(' ').slice(1).join(' ') || '',
            username: 'system'
          }
        };
        
        // Add type-specific properties
        if (noteType === 'step') {
          return {
            ...baseNote,
            step_name: note.step_name || 'Unknown Step',
            type: 'step' as const,
            option_selected: note.option_selected || undefined
          };
        } else if (noteType === 'job') {
          return {
            ...baseNote,
            type: 'job' as const,
            job: note.job
          };
        } else {
          return {
            ...baseNote,
            type: 'site' as const
          };
        }
      });
      
      // Sort all notes by date (newest first)
      allNotes.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      setNotes(allNotes);
    } catch (err) {
      console.error("Error fetching notes:", err);
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
          id: addedNote.id.toString(), // Convert id to string to match our Note type
          type: 'job' as const
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
      console.error("Error adding note:", err);
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
        return "Job Note";
      case 'step':
        return `Step: ${(note as StepNote).step_name}`;
      case 'site':
        return "Site Note";
      default:
        return "Note";
    }
  };

  // Function to get note type badge color
  const getNoteTypeBadgeClass = (note: Note) => {
    switch (note.type) {
      case 'job':
        return "bg-blue-100 text-blue-800";
      case 'step':
        return "bg-green-100 text-green-800";
      case 'site':
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[950px] max-h-[80vh] flex flex-col">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-2xl">All Notes</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 flex-1 overflow-hidden flex flex-col">
          {/* Search and filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
            <Tabs 
              value={activeTab} 
              onValueChange={setActiveTab} 
              className="w-full sm:w-auto"
              defaultValue="all"
            >
              <TabsList className="min-w-[260px]">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="job">Job</TabsTrigger>
                <TabsTrigger value="step">Steps</TabsTrigger>
                <TabsTrigger value="site">Site</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {/* Notes list */}
          <div className="overflow-y-auto flex-1 border rounded-md shadow-sm max-h-[50vh]">
            {loading ? (
              <div className="p-6 text-center text-gray-500">Loading notes...</div>
            ) : error ? (
              <div className="p-6 text-center text-red-500">{error}</div>
            ) : filteredNotes.length === 0 ? (
              <div className="p-6 text-center text-gray-500">No notes found</div>
            ) : (
              <div className="divide-y overflow-y-auto">
                {filteredNotes.map((note) => (
                  <div key={`${note.type}-${note.id}`} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3 text-base">
                          {note.created_by.first_name?.[0] || note.created_by.username?.[0] || '?'}
                        </div>
                        <div>
                          <div className="font-medium text-base">
                            {note.created_by.first_name} {note.created_by.last_name || ''}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(note.created_at)}
                          </div>
                        </div>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full ${getNoteTypeBadgeClass(note)}`}>
                        {getNoteTypeLabel(note)}
                      </span>
                    </div>
                    
                    <div className="mt-4 ml-13">
                      <p className="whitespace-pre-wrap text-gray-800">{note.content}</p>
                      
                      {/* Show selected option for step notes */}
                      {note.type === 'step' && (note as StepNote).option_selected && (
                        <div className="mt-3 bg-gray-50 p-3 rounded-md text-sm border border-gray-100">
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
          <div className="space-y-3 pt-2">
            <div className="font-medium text-base">Add New Note</div>
            <Textarea
              placeholder="Type your note here..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={3}
              className="min-h-[80px]"
            />
            <div className="flex justify-end">
              <Button onClick={handleAddNote} disabled={isSubmitting} size="lg" className="px-6">
                {isSubmitting ? "Adding..." : "Add Note"}
              </Button>
            </div>
          </div>
        </div>
        
        <DialogFooter className="pt-4 border-t mt-6">
          <Button variant="outline" onClick={onClose} size="lg">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 