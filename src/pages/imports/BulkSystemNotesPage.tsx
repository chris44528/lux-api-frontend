import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useToast } from '../../hooks/use-toast';
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
import api from '../../services/api';

interface Department {
  id: number;
  name: string;
  icon: string;
  color: string;
  is_active: boolean;
}

interface CreatedNote {
  id: number;
  site_id: number;
  notes: string;
  note_date: string;
  note_author: string;
  site_name: string;
  department: Department;
}

const BulkSystemNotesPage: React.FC = () => {
  const [siteNames, setSiteNames] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
    createdNotes?: CreatedNote[];
    sitesProcessed?: string[];
  } | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    site_names?: string[];
    notes?: string[];
  }>({});

  const { toast } = useToast();

  // Fetch departments on component mount
  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setIsLoadingDepartments(true);
    try {
      const response = await api.get('/departments/');
      const activeDepartments = response.data.filter((dept: Department) => dept.is_active);
      setDepartments(activeDepartments);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
      toast({
        title: "Error",
        description: "Failed to load departments",
        variant: "destructive"
      });
    } finally {
      setIsLoadingDepartments(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous results and errors
    setUploadResult(null);
    setValidationErrors({});

    // Validate inputs
    if (!siteNames.trim()) {
      setValidationErrors({ site_names: ['Site names are required'] });
      return;
    }

    if (!noteContent.trim()) {
      setValidationErrors({ notes: ['Note content is required'] });
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        site_names: siteNames,
        notes: noteContent,
        department_id: selectedDepartment ? parseInt(selectedDepartment) : null
      };

      const response = await api.post('/system-notes/bulk_upload/', payload);

      setUploadResult({
        success: true,
        message: response.data.message,
        createdNotes: response.data.created_notes,
        sitesProcessed: response.data.sites_processed
      });

      toast({
        title: "Success",
        description: response.data.message,
      });

      // Clear form after successful upload
      setSiteNames('');
      setNoteContent('');
      setSelectedDepartment('');
    } catch (error: any) {
      if (error.response && error.response.status === 400) {
        // Handle validation errors
        setValidationErrors(error.response.data);
        
        // Extract error message
        let errorMessage = 'Failed to upload notes';
        if (error.response.data.site_names) {
          errorMessage = error.response.data.site_names[0];
        } else if (error.response.data.notes) {
          errorMessage = error.response.data.notes[0];
        }

        setUploadResult({
          success: false,
          message: errorMessage
        });

        toast({
          title: "Validation Error",
          description: errorMessage,
          variant: "destructive"
        });
      } else {
        setUploadResult({
          success: false,
          message: 'An unexpected error occurred'
        });

        toast({
          title: "Error",
          description: "Failed to upload bulk notes",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getSiteCount = () => {
    if (!siteNames.trim()) return 0;
    
    // Split by newlines first, then by commas if no newlines
    const lines = siteNames.split('\n').filter(line => line.trim());
    if (lines.length > 1) {
      return lines.length;
    }
    
    // If single line, split by commas
    return siteNames.split(',').filter(site => site.trim()).length;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Bulk System Notes Upload</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Add the same note to multiple sites at once by providing a list of site names
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Form */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Bulk Notes</CardTitle>
            <CardDescription>
              Enter site names and the note content to be added to all specified sites
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="site-names">
                  Site Names
                  <span className="text-sm text-gray-500 ml-2">
                    ({getSiteCount()} sites)
                  </span>
                </Label>
                <Textarea
                  id="site-names"
                  placeholder="Enter site names separated by commas or one per line&#10;Example:&#10;Site A&#10;Site B&#10;Site C&#10;&#10;Or: Site A, Site B, Site C"
                  value={siteNames}
                  onChange={(e) => setSiteNames(e.target.value)}
                  className="min-h-[150px] font-mono text-sm"
                  disabled={isLoading}
                />
                {validationErrors.site_names && (
                  <p className="text-sm text-red-500">{validationErrors.site_names[0]}</p>
                )}
                <p className="text-xs text-gray-500">
                  Paste a list of site names from Excel or enter them manually
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="note-content">Note Content</Label>
                <Textarea
                  id="note-content"
                  placeholder="Enter the note that will be added to all selected sites"
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="min-h-[100px]"
                  disabled={isLoading}
                />
                {validationErrors.notes && (
                  <p className="text-sm text-red-500">{validationErrors.notes[0]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department (Optional)</Label>
                <div className="flex gap-2">
                  <Select
                    value={selectedDepartment}
                    onValueChange={setSelectedDepartment}
                    disabled={isLoading || isLoadingDepartments}
                  >
                    <SelectTrigger id="department" className="flex-1">
                      <SelectValue placeholder={isLoadingDepartments ? "Loading departments..." : "Select a department (optional)"} />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id.toString()}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedDepartment && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setSelectedDepartment('')}
                      disabled={isLoading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Associate these notes with a specific department. Leave unselected for no department.
                </p>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !siteNames.trim() || !noteContent.trim()}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Upload className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Notes to {getSiteCount()} Sites
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results/Instructions */}
        <div className="space-y-6">
          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium">Site Names Format</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Enter site names either comma-separated or one per line. 
                    You can copy and paste from Excel or other sources.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium">Note Content</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    The same note will be added to all specified sites with the current 
                    timestamp and your username as the author.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium">Validation</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    All site names must exist in the system. If any site name is invalid, 
                    the entire upload will fail and you'll see which sites weren't found.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upload Result */}
          {uploadResult && (
            <Card className={uploadResult.success ? 'border-green-500' : 'border-red-500'}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {uploadResult.success ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      Upload Successful
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5 text-red-500" />
                      Upload Failed
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert className={uploadResult.success ? 'border-green-200' : 'border-red-200'}>
                  <AlertDescription>{uploadResult.message}</AlertDescription>
                </Alert>

                {uploadResult.sitesProcessed && uploadResult.sitesProcessed.length > 0 && (
                  <div className="mt-4">
                    <p className="font-medium mb-2">Sites Processed:</p>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded p-3 max-h-48 overflow-y-auto">
                      <ul className="text-sm space-y-1">
                        {uploadResult.sitesProcessed.map((site, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            {site}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkSystemNotesPage;