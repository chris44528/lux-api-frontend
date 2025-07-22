import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  ArrowLeft,
  Clock,
  User,
  Mail,
  Phone,
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Home,
  MapPin,
  History,
  MessageSquare,
} from "lucide-react";
import transferService, { Transfer } from '@/services/transferService';
import { format } from 'date-fns';

export default function TransferDetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [transfer, setTransfer] = useState<Transfer | null>(null);
  const [loading, setLoading] = useState(true);
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [extending, setExtending] = useState(false);
  const [extensionDays, setExtensionDays] = useState('7');
  const [extensionReason, setExtensionReason] = useState('');

  useEffect(() => {
    if (id) {
      loadTransfer();
    }
  }, [id]);

  const loadTransfer = async () => {
    try {
      setLoading(true);
      const data = await transferService.getTransfer(parseInt(id!));
      setTransfer(data);
    } catch (error) {
      console.error('Failed to load transfer:', error);
      toast({
        title: "Error",
        description: "Failed to load transfer details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExtendToken = async () => {
    if (!transfer) return;
    
    setExtending(true);
    try {
      const updatedTransfer = await transferService.extendToken(transfer.id, {
        days: parseInt(extensionDays),
        reason: extensionReason,
      });
      
      setTransfer(updatedTransfer);
      setShowExtendDialog(false);
      setExtensionReason('');
      
      toast({
        title: "Token Extended",
        description: `Token has been extended by ${extensionDays} days`,
      });
    } catch (error) {
      console.error('Failed to extend token:', error);
      toast({
        title: "Error",
        description: "Failed to extend token",
        variant: "destructive",
      });
    } finally {
      setExtending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'default' as const, icon: Clock, color: 'text-blue-600' },
      completed: { variant: 'success' as const, icon: CheckCircle, color: 'text-green-600' },
      expired: { variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' },
      extended: { variant: 'secondary' as const, icon: RefreshCw, color: 'text-purple-600' },
      under_review: { variant: 'outline' as const, icon: Clock, color: 'text-yellow-600' },
      approved: { variant: 'success' as const, icon: CheckCircle, color: 'text-green-600' },
      rejected: { variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={`flex items-center gap-1 ${config.color}`}>
        <Icon className="h-3 w-3" />
        {transfer?.status_display}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!transfer) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <p className="text-gray-500">Transfer not found</p>
          <Button
            variant="outline"
            onClick={() => navigate('/transfers')}
            className="mt-4"
          >
            Back to Transfers
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/transfers')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Transfer Details</h1>
            <p className="text-gray-500">ID: AAMI{transfer.id.toString().padStart(6, '0')}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {getStatusBadge(transfer.status)}
          {transfer.is_urgent && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Expires in {transfer.days_until_expiry} days
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Details */}
        <div className="md:col-span-2 space-y-6">
          {/* Site Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Property Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-gray-500">Site Name</Label>
                <p className="font-medium">{transfer.site_details?.site_name}</p>
              </div>
              <div>
                <Label className="text-gray-500">Address</Label>
                <p className="font-medium">{transfer.site_details?.site_address}</p>
              </div>
              <div>
                <Label className="text-gray-500">Site ID</Label>
                <p className="font-medium">{transfer.site}</p>
              </div>
            </CardContent>
          </Card>

          {/* Form Data */}
          {transfer.status !== 'pending' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Submitted Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500">Sale Completion Date</Label>
                    <p className="font-medium">
                      {transfer.sale_completion_date 
                        ? format(new Date(transfer.sale_completion_date), 'MMM d, yyyy')
                        : 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Evidence Type</Label>
                    <p className="font-medium">{transfer.evidence_document_type || 'Not provided'}</p>
                  </div>
                </div>
                
                <div>
                  <Label className="text-gray-500">Legal Proprietors</Label>
                  <div className="space-y-1">
                    {transfer.legal_proprietor_1 && <p className="font-medium">1. {transfer.legal_proprietor_1}</p>}
                    {transfer.legal_proprietor_2 && <p className="font-medium">2. {transfer.legal_proprietor_2}</p>}
                    {transfer.legal_proprietor_3 && <p className="font-medium">3. {transfer.legal_proprietor_3}</p>}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500 flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      Phone Number
                    </Label>
                    <p className="font-medium">{transfer.phone_number || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500 flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      Mobile Number
                    </Label>
                    <p className="font-medium">{transfer.mobile_number || 'Not provided'}</p>
                  </div>
                </div>
                
                <div>
                  <Label className="text-gray-500 flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    Email Address
                  </Label>
                  <p className="font-medium">{transfer.form_email || 'Not provided'}</p>
                </div>
                
                <div>
                  <Label className="text-gray-500 flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    Postal Address
                  </Label>
                  <p className="font-medium whitespace-pre-wrap">
                    {transfer.postal_address || 'Not provided'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documents */}
          {transfer.documents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Uploaded Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {transfer.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{doc.file_name}</p>
                        <p className="text-sm text-gray-500">
                          Uploaded {format(new Date(doc.uploaded_at), 'MMM d, yyyy')} by {doc.uploaded_by_name}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(doc.file_url, '_blank')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {transfer.can_be_extended && (
                <Button
                  className="w-full"
                  onClick={() => setShowExtendDialog(true)}
                  disabled={transfer.status === 'completed'}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Extend Token
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate(`/site/${transfer.site}`)}
              >
                <Home className="mr-2 h-4 w-4" />
                View Site
              </Button>
            </CardContent>
          </Card>

          {/* Token Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Token Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-gray-500">Created</Label>
                <p className="font-medium">
                  {format(new Date(transfer.token_created_at), 'MMM d, yyyy HH:mm')}
                </p>
              </div>
              <div>
                <Label className="text-gray-500">Expires</Label>
                <p className="font-medium">
                  {format(new Date(transfer.token_expires_at), 'MMM d, yyyy HH:mm')}
                </p>
              </div>
              {transfer.token_extended_count > 0 && (
                <>
                  <div>
                    <Label className="text-gray-500">Extensions</Label>
                    <p className="font-medium">{transfer.token_extended_count} / 3</p>
                  </div>
                  {transfer.token_last_extended_at && (
                    <div>
                      <Label className="text-gray-500">Last Extended</Label>
                      <p className="font-medium">
                        {format(new Date(transfer.token_last_extended_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  )}
                </>
              )}
              <div>
                <Label className="text-gray-500">Homeowner Email</Label>
                <p className="font-medium">{transfer.homeowner_email}</p>
              </div>
            </CardContent>
          </Card>

          {/* Assignment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Assignment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-gray-500">Created By</Label>
                <p className="font-medium">{transfer.created_by_name || 'System'}</p>
              </div>
              {transfer.assigned_to_name && (
                <div>
                  <Label className="text-gray-500">Assigned To</Label>
                  <p className="font-medium">{transfer.assigned_to_name}</p>
                </div>
              )}
              {transfer.reviewed_by_name && (
                <div>
                  <Label className="text-gray-500">Reviewed By</Label>
                  <p className="font-medium">{transfer.reviewed_by_name}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Activity Tabs */}
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="notifications">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="notifications">
                <MessageSquare className="mr-2 h-4 w-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="reviews">
                <History className="mr-2 h-4 w-4" />
                Activity Log
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="notifications" className="mt-4">
              {transfer.notifications.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No notifications sent</p>
              ) : (
                <div className="space-y-3">
                  {transfer.notifications.map((notification) => (
                    <div key={notification.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">{notification.notification_type_display}</Badge>
                        <span className="text-sm text-gray-500">
                          {format(new Date(notification.sent_at), 'MMM d, yyyy HH:mm')}
                        </span>
                      </div>
                      <p className="text-sm">
                        Sent to: <span className="font-medium">{notification.sent_to}</span>
                      </p>
                      {notification.sent_by_name && (
                        <p className="text-sm text-gray-500">
                          By: {notification.sent_by_name}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="reviews" className="mt-4">
              {transfer.reviews.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No activity recorded</p>
              ) : (
                <div className="space-y-3">
                  {transfer.reviews.map((review) => (
                    <div key={review.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">{review.action_display}</Badge>
                        <span className="text-sm text-gray-500">
                          {format(new Date(review.created_at), 'MMM d, yyyy HH:mm')}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{review.reviewer_name}</p>
                      {review.notes && (
                        <p className="text-sm mt-2">{review.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Extend Token Dialog */}
      <Dialog open={showExtendDialog} onOpenChange={setShowExtendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend Token</DialogTitle>
            <DialogDescription>
              Extend the token expiration for this transfer. The homeowner will be notified.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="days">Extension Period</Label>
              <Select value={extensionDays} onValueChange={setExtensionDays}>
                <SelectTrigger id="days">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for extension..."
                value={extensionReason}
                onChange={(e) => setExtensionReason(e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="text-sm text-gray-500">
              <p>Current expiry: {format(new Date(transfer.token_expires_at), 'MMM d, yyyy')}</p>
              <p>Extensions used: {transfer.token_extended_count} / 3</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExtendDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleExtendToken} disabled={extending}>
              {extending ? 'Extending...' : 'Extend Token'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}