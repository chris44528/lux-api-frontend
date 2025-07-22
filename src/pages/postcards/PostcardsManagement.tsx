import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Checkbox } from '../../components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Send, Printer, AlertCircle, Filter } from 'lucide-react';
import postcardService, { PostcardRequest } from '../../services/postcardService';
import { toast } from '../../components/ui/use-toast';
import { useUIPermission } from '../../hooks/useUIPermission';

export default function PostcardsManagement() {
  const [postcards, setPostcards] = useState<PostcardRequest[]>([]);
  const [selectedPostcards, setSelectedPostcards] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const [selectedPostcardNumber, setSelectedPostcardNumber] = useState<number | 'all'>('all');

  // Check permissions
  const canPrintLabels = useUIPermission('jobs.postcards.print_labels');
  const canMarkAsSent = useUIPermission('jobs.postcards.mark_as_sent');
  const canSendViaDocmail = useUIPermission('jobs.postcards.send_via_docmail');

  useEffect(() => {
    fetchPendingPostcards();
  }, []);

  // Filter postcards based on selected postcard number
  const filteredPostcards = selectedPostcardNumber === 'all' 
    ? postcards 
    : postcards.filter(pc => pc.postcard_number === selectedPostcardNumber);

  const fetchPendingPostcards = async () => {
    try {
      setLoading(true);
      const response = await postcardService.getPendingPostcards();
      setPostcards(response.postcards);
    } catch (error) {
      console.error('Failed to fetch postcards:', error);
      toast.error('Failed to load pending postcards');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPostcards(new Set(filteredPostcards.map(pc => pc.id)));
    } else {
      setSelectedPostcards(new Set());
    }
  };

  const handleSelectPostcard = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedPostcards);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedPostcards(newSelected);
  };

  const handleSendViaDocmail = () => {
    setShowComingSoonModal(true);
  };

  const handlePrintLabels = async () => {
    if (selectedPostcards.size === 0) {
      toast.error('Please select at least one postcard');
      return;
    }

    try {
      setProcessing(true);
      
      // Generate and download PDF
      const selectedIds = Array.from(selectedPostcards);
      const pdfBlob = await postcardService.generateLabels(selectedIds);
      
      // Create download link
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `postcard_labels_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Mark as sent
      const result = await postcardService.markAsSent(selectedIds);
      
      if (result.errors.length > 0) {
        toast.error(`Some postcards could not be updated: ${result.errors.join(', ')}`);
      } else {
        toast.success(`${result.updated} postcards marked as sent`);
      }
      
      // Refresh the list
      fetchPendingPostcards();
      setSelectedPostcards(new Set());
      
    } catch (error) {
      console.error('Failed to process postcards:', error);
      toast.error('Failed to generate labels or update status');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6 dark:text-white">Post Cards Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Loading pending postcards...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold dark:text-white">Post Cards Management</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage and print labels for postcard requests
        </p>
      </div>

      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {postcards.length} pending postcard{postcards.length !== 1 ? 's' : ''}
                  {selectedPostcardNumber !== 'all' && ` (${filteredPostcards.length} shown)`}
                </p>
                {selectedPostcards.size > 0 && (
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    {selectedPostcards.size} selected
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <Select 
                  value={selectedPostcardNumber.toString()} 
                  onValueChange={(value) => {
                    setSelectedPostcardNumber(value === 'all' ? 'all' : parseInt(value));
                    setSelectedPostcards(new Set()); // Clear selections when filter changes
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by PC number" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Postcards</SelectItem>
                    <SelectItem value="1">Postcard 1</SelectItem>
                    <SelectItem value="2">Postcard 2</SelectItem>
                    <SelectItem value="3">Postcard 3</SelectItem>
                    <SelectItem value="4">Postcard 4</SelectItem>
                    <SelectItem value="5">Postcard 5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              {canSendViaDocmail && (
                <Button
                  variant="outline"
                  onClick={handleSendViaDocmail}
                  disabled={selectedPostcards.size === 0 || processing}
                  className="dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send via Docmail
                </Button>
              )}
              {(canPrintLabels && canMarkAsSent) && (
                <Button
                  onClick={handlePrintLabels}
                  disabled={selectedPostcards.size === 0 || processing}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Labels & Mark as Sent
                </Button>
              )}
            </div>
          </div>

          {filteredPostcards.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {postcards.length === 0 
                  ? 'No pending postcards to process'
                  : `No pending postcards for Postcard ${selectedPostcardNumber}`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="dark:border-gray-700">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedPostcards.size === filteredPostcards.length && filteredPostcards.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Job</TableHead>
                    <TableHead>Site Name</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Postcode</TableHead>
                    <TableHead>PC #</TableHead>
                    <TableHead>Requested</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPostcards.map((postcard) => (
                    <TableRow key={postcard.id} className="dark:border-gray-700">
                      <TableCell>
                        <Checkbox
                          checked={selectedPostcards.has(postcard.id)}
                          onCheckedChange={(checked) => 
                            handleSelectPostcard(postcard.id, checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium dark:text-white">#{postcard.job.id}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {postcard.job.title}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="dark:text-gray-200">
                        {postcard.job.site?.site_name || 'N/A'}
                      </TableCell>
                      <TableCell className="dark:text-gray-200">
                        {postcard.recipient_name || postcard.job.client}
                      </TableCell>
                      <TableCell className="dark:text-gray-200">
                        <div>
                          <p>{postcard.address_line1 || postcard.job.address}</p>
                          {postcard.address_line2 && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {postcard.address_line2}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="dark:text-gray-200">
                        {postcard.postcode || postcard.job.site?.postcode || 'N/A'}
                      </TableCell>
                      <TableCell className="dark:text-gray-200">
                        {postcard.postcard_number}
                      </TableCell>
                      <TableCell className="dark:text-gray-200">
                        {new Date(postcard.requested_date).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Coming Soon Modal */}
      {showComingSoonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md">
            <h2 className="text-xl font-bold mb-4 dark:text-white">Coming Soon!</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              The Docmail integration feature is currently under development and will be available soon.
            </p>
            <Button
              onClick={() => setShowComingSoonModal(false)}
              className="w-full"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}