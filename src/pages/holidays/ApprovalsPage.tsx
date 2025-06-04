import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Check, X, Clock, Calendar, User, Briefcase } from 'lucide-react';
import { holidayService, HolidayRequest } from '@/services/holidayService';
import { format } from 'date-fns';
import moment from 'moment';

export default function ApprovalsPage() {
  const [pendingRequests, setPendingRequests] = useState<HolidayRequest[]>([]);
  const [processedRequests, setProcessedRequests] = useState<HolidayRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<HolidayRequest | null>(null);
  const [actionDialog, setActionDialog] = useState<{ open: boolean; type: 'approve' | 'reject' | null }>({ open: false, type: null });
  const [comments, setComments] = useState('');
  const [conflicts, setConflicts] = useState<Record<number, any>>({});

  useEffect(() => {
    loadApprovals();
  }, []);

  const loadApprovals = async () => {
    try {
      setLoading(true);
      const response = await holidayService.getPendingApprovals();
      const pending = response.results.filter(r => r.status === 'PENDING');
      const processed = response.results.filter(r => r.status !== 'PENDING');
      
      setPendingRequests(pending);
      setProcessedRequests(processed);

      // Load conflicts for each pending request
      const conflictPromises = pending.map(async (request) => {
        try {
          const conflictData = await holidayService.checkJobConflicts(request.id);
          return { id: request.id, conflicts: conflictData };
        } catch (error) {
          return { id: request.id, conflicts: null };
        }
      });

      const conflictResults = await Promise.all(conflictPromises);
      const conflictMap = conflictResults.reduce((acc, { id, conflicts }) => {
        acc[id] = conflicts;
        return acc;
      }, {} as Record<number, any>);

      setConflicts(conflictMap);
    } catch (error) {
      console.error('Failed to load approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    try {
      await holidayService.approveHolidayRequest(selectedRequest.id, comments);
      setActionDialog({ open: false, type: null });
      setSelectedRequest(null);
      setComments('');
      await loadApprovals();
    } catch (error) {
      console.error('Failed to approve request:', error);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !comments.trim()) return;

    try {
      await holidayService.rejectHolidayRequest(selectedRequest.id, comments);
      setActionDialog({ open: false, type: null });
      setSelectedRequest(null);
      setComments('');
      await loadApprovals();
    } catch (error) {
      console.error('Failed to reject request:', error);
    }
  };

  const openActionDialog = (request: HolidayRequest, type: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setActionDialog({ open: true, type });
    setComments('');
  };

  const RequestCard = ({ request }: { request: HolidayRequest }) => {
    const requestConflicts = conflicts[request.id];
    const hasConflicts = requestConflicts && requestConflicts.length > 0;

    return (
      <Card className="mb-4">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg flex items-center gap-2 dark:text-gray-100">
                <User className="w-4 h-4" />
                {request.user.full_name}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{request.user.department}</p>
            </div>
            <Badge variant={request.status === 'PENDING' ? 'warning' : request.status === 'APPROVED' ? 'success' : 'destructive'}>
              {request.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm font-medium mb-1 dark:text-gray-200">Holiday Type</p>
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: request.holiday_type.color }}
                />
                {request.holiday_type.name}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-1 dark:text-gray-200">Duration</p>
              <p className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {request.total_days} days
              </p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1 dark:text-gray-200">Start Date</p>
              <p>{format(new Date(request.start_date), 'dd MMM yyyy')}{request.start_half_day && ' (PM)'}</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1 dark:text-gray-200">End Date</p>
              <p>{format(new Date(request.end_date), 'dd MMM yyyy')}{request.end_half_day && ' (AM)'}</p>
            </div>
          </div>

          {request.reason && (
            <div className="mb-4">
              <p className="text-sm font-medium mb-1 dark:text-gray-200">Reason</p>
              <p className="text-sm text-muted-foreground">{request.reason}</p>
            </div>
          )}

          {hasConflicts && (
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-1 flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Job Conflicts
              </p>
              <ul className="text-sm text-yellow-800 dark:text-yellow-200 list-disc list-inside">
                {requestConflicts.map((conflict: any, index: number) => (
                  <li key={index}>{conflict.description}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="text-sm text-muted-foreground mb-4">
            <p className="dark:text-gray-300">Submitted: {request.submitted_at ? format(new Date(request.submitted_at), 'dd MMM yyyy HH:mm') : 'Draft'}</p>
          </div>

          {request.status === 'PENDING' && (
            <div className="flex gap-2 justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => openActionDialog(request, 'reject')}
              >
                <X className="w-4 h-4 mr-1" />
                Reject
              </Button>
              <Button
                size="sm"
                onClick={() => openActionDialog(request, 'approve')}
              >
                <Check className="w-4 h-4 mr-1" />
                Approve
              </Button>
            </div>
          )}

          {request.approvals && request.approvals.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-medium mb-2 dark:text-gray-200">Approval History</p>
              {request.approvals.map((approval) => (
                <div key={approval.id} className="text-sm text-muted-foreground mb-2">
                  <p>
                    <strong>{approval.approver.full_name}</strong> - {approval.status}
                    {approval.approved_at && ` on ${format(new Date(approval.approved_at), 'dd MMM yyyy')}`}
                  </p>
                  {approval.comments && <p className="italic">"{approval.comments}"</p>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold dark:text-gray-100">Holiday Approvals</h1>
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-muted-foreground" />
          <span className="text-muted-foreground">
            {pendingRequests.length} pending approval{pendingRequests.length !== 1 && 's'}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <Tabs defaultValue="pending" className="w-full">
          <TabsList>
            <TabsTrigger value="pending">
              Pending ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="processed">
              Processed ({processedRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {pendingRequests.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-muted-foreground">No pending approval requests</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {pendingRequests.map((request) => (
                  <RequestCard key={request.id} request={request} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="processed">
            {processedRequests.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-muted-foreground">No processed requests</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {processedRequests.map((request) => (
                  <RequestCard key={request.id} request={request} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      <Dialog 
        open={actionDialog.open} 
        onOpenChange={(open) => !open && setActionDialog({ open: false, type: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === 'approve' ? 'Approve' : 'Reject'} Holiday Request
            </DialogTitle>
            <DialogDescription>
              {selectedRequest && (
                <div className="mt-2">
                  <p><strong>{selectedRequest.user.full_name}</strong></p>
                  <p>{selectedRequest.holiday_type.name} - {selectedRequest.total_days} days</p>
                  <p>
                    {format(new Date(selectedRequest.start_date), 'dd MMM yyyy')} - 
                    {format(new Date(selectedRequest.end_date), 'dd MMM yyyy')}
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder={actionDialog.type === 'reject' ? 'Please provide a reason for rejection (required)' : 'Add a comment (optional)'}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ open: false, type: null })}>
              Cancel
            </Button>
            <Button 
              onClick={actionDialog.type === 'approve' ? handleApprove : handleReject}
              disabled={actionDialog.type === 'reject' && !comments.trim()}
              variant={actionDialog.type === 'approve' ? 'default' : 'destructive'}
            >
              {actionDialog.type === 'approve' ? 'Approve Request' : 'Reject Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}