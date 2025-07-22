import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  User,
  Calendar,
  Phone,
  Mail,
  Home,
  Clock,
  MessageSquare,
  FileCheck,
  Download,
} from 'lucide-react';
import transferService from '@/services/transferService';
import { format } from 'date-fns';
import ApprovalDialog from '@/components/transfers/ApprovalDialog';
import RejectionDialog from '@/components/transfers/RejectionDialog';
import InfoRequestDialog from '@/components/transfers/InfoRequestDialog';
import ValidationReport from '@/components/transfers/ValidationReport';

export default function TransferReviewDashboard() {
  const { id } = useParams<{ id: string }>();
  const [showApproval, setShowApproval] = useState(false);
  const [showRejection, setShowRejection] = useState(false);
  const [showInfoRequest, setShowInfoRequest] = useState(false);

  const { data: transfer, isLoading, refetch } = useQuery({
    queryKey: ['transfer', id],
    queryFn: () => transferService.getTransferById(id!),
  });

  const { data: validation } = useQuery({
    queryKey: ['transfer-validation', id],
    queryFn: () => transferService.getValidation(id!),
    enabled: !!transfer && ['submitted', 'under_review', 'needs_info'].includes(transfer.status),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!transfer) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Transfer not found</AlertDescription>
      </Alert>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'secondary', icon: Clock },
      submitted: { variant: 'warning', icon: FileText },
      under_review: { variant: 'default', icon: AlertCircle },
      needs_info: { variant: 'warning', icon: MessageSquare },
      approved: { variant: 'success', icon: CheckCircle },
      rejected: { variant: 'destructive', icon: XCircle },
      completed: { variant: 'success', icon: FileCheck },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { variant: 'secondary', icon: AlertCircle };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant as any} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {transfer.status_display}
      </Badge>
    );
  };

  const canReview = ['submitted', 'under_review', 'needs_info'].includes(transfer.status);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Transfer Review</h1>
          <p className="text-muted-foreground mt-1">
            Review and process home owner transfer for {transfer.site_details.site_name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(transfer.status)}
          {transfer.is_urgent && (
            <Badge variant="destructive">Urgent</Badge>
          )}
        </div>
      </div>

      {/* Validation Summary */}
      {validation && (
        <Card className={validation.is_valid ? 'border-green-500' : 'border-orange-500'}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Validation Score</span>
              <span className={`text-2xl ${validation.is_valid ? 'text-green-600' : 'text-orange-600'}`}>
                {validation.overall_score.toFixed(0)}%
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {validation.issues.length > 0 && (
              <div className="space-y-2">
                <p className="font-medium text-red-600">Issues:</p>
                <ul className="list-disc list-inside space-y-1">
                  {validation.issues.map((issue, idx) => (
                    <li key={idx} className="text-sm text-red-600">{issue}</li>
                  ))}
                </ul>
              </div>
            )}
            {validation.warnings.length > 0 && (
              <div className="space-y-2 mt-4">
                <p className="font-medium text-orange-600">Warnings:</p>
                <ul className="list-disc list-inside space-y-1">
                  {validation.warnings.map((warning, idx) => (
                    <li key={idx} className="text-sm text-orange-600">{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {canReview && (
        <Card>
          <CardHeader>
            <CardTitle>Review Actions</CardTitle>
            <CardDescription>
              Choose an action to process this transfer
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button
              variant="default"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => setShowApproval(true)}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Approve Transfer
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowRejection(true)}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Reject Transfer
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowInfoRequest(true)}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Request Information
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Transfer Details Tabs */}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="site">Site Info</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Homeowner Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Legal Proprietors</p>
                  <div className="mt-1 space-y-1">
                    {transfer.legal_proprietor_1 && (
                      <p className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {transfer.legal_proprietor_1}
                      </p>
                    )}
                    {transfer.legal_proprietor_2 && (
                      <p className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {transfer.legal_proprietor_2}
                      </p>
                    )}
                    {transfer.legal_proprietor_3 && (
                      <p className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {transfer.legal_proprietor_3}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Contact Information</p>
                  <div className="mt-1 space-y-1">
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {transfer.form_email}
                    </p>
                    {transfer.phone_number && (
                      <p className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {transfer.phone_number}
                      </p>
                    )}
                    {transfer.mobile_number && (
                      <p className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {transfer.mobile_number} (Mobile)
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sale Completion Date</p>
                  <p className="mt-1 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {transfer.sale_completion_date 
                      ? format(new Date(transfer.sale_completion_date), 'PPP')
                      : 'Not provided'}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Postal Address</p>
                  <p className="mt-1 flex items-start gap-2">
                    <Home className="h-4 w-4 mt-0.5" />
                    <span className="whitespace-pre-line">
                      {transfer.postal_address || 'Not provided'}
                    </span>
                  </p>
                </div>
              </div>

              {transfer.evidence_document_type && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Evidence Type</p>
                    <p className="mt-1">{transfer.evidence_document_type}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Uploaded Documents</CardTitle>
              <CardDescription>
                Review all documents submitted with this transfer
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transfer.documents.length === 0 ? (
                <p className="text-muted-foreground">No documents uploaded</p>
              ) : (
                <div className="space-y-3">
                  {transfer.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{doc.file_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(doc.file_size / 1024 / 1024).toFixed(2)} MB • 
                            Uploaded {format(new Date(doc.uploaded_at), 'PPp')}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a href={doc.file_url} download>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validation">
          {validation ? (
            <ValidationReport validation={validation} />
          ) : (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">
                  Validation is only available for submitted transfers
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Reviews */}
                {transfer.reviews.map((review) => (
                  <div key={review.id} className="flex gap-4 pb-4 border-b last:border-0">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{review.reviewer_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {review.action_display} • {format(new Date(review.created_at), 'PPp')}
                      </p>
                      {review.notes && (
                        <p className="mt-1 text-sm">{review.notes}</p>
                      )}
                    </div>
                  </div>
                ))}

                {/* Notifications */}
                {transfer.notifications.map((notification) => (
                  <div key={notification.id} className="flex gap-4 pb-4 border-b last:border-0">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <Mail className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{notification.subject}</p>
                      <p className="text-sm text-muted-foreground">
                        Sent to {notification.sent_to} • {format(new Date(notification.sent_at), 'PPp')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="site" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Site Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Site Name</p>
                  <p className="mt-1">{transfer.site_details.site_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Site Reference</p>
                  <p className="mt-1">{transfer.site_details.site_reference}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Address</p>
                  <p className="mt-1">{transfer.site_details.site_address}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Postcode</p>
                  <p className="mt-1">{transfer.site_details.site_postcode}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ApprovalDialog
        open={showApproval}
        onOpenChange={setShowApproval}
        transfer={transfer}
        onSuccess={() => {
          refetch();
          setShowApproval(false);
        }}
      />

      <RejectionDialog
        open={showRejection}
        onOpenChange={setShowRejection}
        transfer={transfer}
        onSuccess={() => {
          refetch();
          setShowRejection(false);
        }}
      />

      <InfoRequestDialog
        open={showInfoRequest}
        onOpenChange={setShowInfoRequest}
        transfer={transfer}
        onSuccess={() => {
          refetch();
          setShowInfoRequest(false);
        }}
      />
    </div>
  );
}