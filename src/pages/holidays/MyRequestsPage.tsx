import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, X, Send, Calendar, Clock } from 'lucide-react';
import { holidayService, HolidayRequest } from '@/services/holidayService';
import { format, isBefore } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function MyRequestsPage() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<HolidayRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<HolidayRequest | null>(null);
  const [cancelDialog, setCancelDialog] = useState(false);

  useEffect(() => {
    loadMyRequests();
  }, []);

  const loadMyRequests = async () => {
    try {
      setLoading(true);
      const response = await holidayService.getMyHolidayRequests();
      setRequests(response.results);
    } catch (error) {
      console.error('Failed to load requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async (request: HolidayRequest) => {
    try {
      await holidayService.submitHolidayRequest(request.id);
      await loadMyRequests();
    } catch (error) {
      console.error('Failed to submit request:', error);
    }
  };

  const handleCancelRequest = async () => {
    if (!selectedRequest) return;
    
    try {
      await holidayService.cancelHolidayRequest(selectedRequest.id);
      setCancelDialog(false);
      setSelectedRequest(null);
      await loadMyRequests();
    } catch (error) {
      console.error('Failed to cancel request:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { variant: 'secondary', label: 'Draft' },
      PENDING: { variant: 'warning', label: 'Pending Approval' },
      APPROVED: { variant: 'success', label: 'Approved' },
      REJECTED: { variant: 'destructive', label: 'Rejected' },
      CANCELLED: { variant: 'secondary', label: 'Cancelled' }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  const draftRequests = requests.filter(r => r.status === 'DRAFT');
  const activeRequests = requests.filter(r => ['PENDING', 'APPROVED'].includes(r.status));
  const pastRequests = requests.filter(r => ['REJECTED', 'CANCELLED'].includes(r.status) || 
    (r.status === 'APPROVED' && isBefore(new Date(r.end_date), new Date())));

  const RequestTable = ({ requests, showActions = true }: { requests: HolidayRequest[], showActions?: boolean }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Type</TableHead>
          <TableHead>Start Date</TableHead>
          <TableHead>End Date</TableHead>
          <TableHead>Days</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Submitted</TableHead>
          {showActions && <TableHead className="text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.length === 0 ? (
          <TableRow>
            <TableCell colSpan={showActions ? 7 : 6} className="text-center text-muted-foreground">
              No requests found
            </TableCell>
          </TableRow>
        ) : (
          requests.map((request) => (
            <TableRow key={request.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: request.holiday_type.color }}
                  />
                  {request.holiday_type.name}
                </div>
              </TableCell>
              <TableCell>
                {format(new Date(request.start_date), 'dd MMM yyyy')}
                {request.start_half_day && ' (PM)'}
              </TableCell>
              <TableCell>
                {format(new Date(request.end_date), 'dd MMM yyyy')}
                {request.end_half_day && ' (AM)'}
              </TableCell>
              <TableCell>{request.total_days}</TableCell>
              <TableCell>{getStatusBadge(request.status)}</TableCell>
              <TableCell>
                {request.submitted_at ? format(new Date(request.submitted_at), 'dd MMM yyyy') : '-'}
              </TableCell>
              {showActions && (
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {request.status === 'DRAFT' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/holidays/request/${request.id}`)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSubmitRequest(request)}
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    {request.status === 'PENDING' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedRequest(request);
                          setCancelDialog(true);
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/holidays/request/${request.id}`)}
                    >
                      View
                    </Button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Holiday Requests</h1>
        <Button onClick={() => navigate('/holidays/request/new')}>
          <Plus className="w-4 h-4 mr-2" />
          New Request
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <Tabs defaultValue="active" className="w-full">
          <TabsList>
            <TabsTrigger value="drafts">
              Drafts ({draftRequests.length})
            </TabsTrigger>
            <TabsTrigger value="active">
              Active ({activeRequests.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past ({pastRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="drafts">
            <Card>
              <CardHeader>
                <CardTitle>Draft Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <RequestTable requests={draftRequests} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="active">
            <Card>
              <CardHeader>
                <CardTitle>Active Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <RequestTable requests={activeRequests} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="past">
            <Card>
              <CardHeader>
                <CardTitle>Past Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <RequestTable requests={pastRequests} showActions={false} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={cancelDialog} onOpenChange={setCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Holiday Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this holiday request? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="py-4">
              <p className="text-sm">
                <strong>Type:</strong> {selectedRequest.holiday_type.name}
              </p>
              <p className="text-sm">
                <strong>Dates:</strong> {format(new Date(selectedRequest.start_date), 'dd MMM yyyy')} - {format(new Date(selectedRequest.end_date), 'dd MMM yyyy')}
              </p>
              <p className="text-sm">
                <strong>Days:</strong> {selectedRequest.total_days}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialog(false)}>
              Keep Request
            </Button>
            <Button variant="destructive" onClick={handleCancelRequest}>
              Cancel Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}