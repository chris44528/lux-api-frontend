import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Users, Clock, ArrowRight, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { holidayService } from '@/services/holidayService';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface PendingApproval {
  id: number;
  user: {
    username: string;
    first_name?: string;
    last_name?: string;
  };
  holiday_type: {
    name: string;
    color: string;
  };
  start_date: string;
  end_date: string;
  days_requested: number;
  reason?: string;
  created_at: string;
}

interface PendingApprovalsWidgetProps {
  className?: string;
}

export default function PendingApprovalsWidget({ className }: PendingApprovalsWidgetProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Check if user is in Manager group
  const isManager = user?.groups?.some(group => group.name === 'Manager') || false;

  useEffect(() => {
    if (isManager) {
      loadPendingApprovals();
    } else {
      setLoading(false);
    }
  }, [isManager]);

  const loadPendingApprovals = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await holidayService.getPendingApprovals();
      setApprovals(response.results.slice(0, 5)); // Show only first 5
    } catch (error) {
      console.error('Failed to load pending approvals:', error);
      setError('Failed to load pending approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await holidayService.approveHolidayRequest(id, 'Approved via dashboard');
      // Reload the approvals
      loadPendingApprovals();
    } catch (error) {
      console.error('Failed to approve request:', error);
    }
  };

  const handleReject = async (id: number) => {
    try {
      await holidayService.rejectHolidayRequest(id, 'Rejected via dashboard');
      // Reload the approvals
      loadPendingApprovals();
    } catch (error) {
      console.error('Failed to reject request:', error);
    }
  };

  const formatUserName = (user: PendingApproval['user']) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.username;
  };

  if (!isManager) {
    return (
      <Card className={cn("h-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Pending Holiday Approvals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Users className="h-4 w-4" />
            <AlertDescription>
              You need to be a manager to view pending approvals.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Pending Holiday Approvals
        </CardTitle>
        {approvals.length > 0 && (
          <Badge variant="secondary" className="font-mono">
            {approvals.length}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : approvals.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-muted-foreground">No pending approvals</p>
          </div>
        ) : (
          <div className="space-y-3">
            {approvals.map((approval) => (
              <div
                key={approval.id}
                className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm truncate">
                        {formatUserName(approval.user)}
                      </p>
                      <Badge
                        variant="outline"
                        className="text-xs"
                        style={{ borderColor: approval.holiday_type.color, color: approval.holiday_type.color }}
                      >
                        {approval.holiday_type.name}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(approval.start_date), 'dd MMM')} - {format(new Date(approval.end_date), 'dd MMM')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {approval.days_requested} days
                      </span>
                    </div>
                    {approval.reason && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {approval.reason}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-100"
                      onClick={() => handleApprove(approval.id)}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
                      onClick={() => handleReject(approval.id)}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            <Button
              variant="outline"
              className="w-full mt-2"
              onClick={() => navigate('/holidays/approvals')}
            >
              View All Approvals
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}