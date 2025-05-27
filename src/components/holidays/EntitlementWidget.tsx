import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { HolidayEntitlement } from '@/services/holidayService';
import { Calendar, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface EntitlementWidgetProps {
  entitlement: HolidayEntitlement;
  className?: string;
}

export default function EntitlementWidget({ entitlement, className }: EntitlementWidgetProps) {
  const navigate = useNavigate();
  
  const totalUsed = entitlement.days_taken + entitlement.days_pending;
  const percentage = entitlement.total_days 
    ? Math.round((totalUsed / entitlement.total_days) * 100) 
    : 0;
  
  const getProgressColor = () => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{entitlement.holiday_type.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <div className="flex justify-center items-center">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  className="text-gray-200 dark:text-gray-700"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - percentage / 100)}`}
                  className={`transition-all duration-300 ${
                    percentage >= 90 ? 'text-red-500' : 
                    percentage >= 75 ? 'text-yellow-500' : 
                    'text-green-500'
                  }`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">
                  {entitlement.days_remaining ?? '∞'}
                </span>
                <span className="text-sm text-muted-foreground">days left</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Allowance</span>
            <span className="font-medium">{entitlement.total_days ?? 'Unlimited'} days</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Used</span>
            <span className="font-medium">{entitlement.days_taken} days</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Pending</span>
            <span className="font-medium text-yellow-600">{entitlement.days_pending} days</span>
          </div>
          {entitlement.total_days && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Remaining</span>
              <span className="font-medium text-green-600">{entitlement.days_remaining} days</span>
            </div>
          )}
        </div>

        {entitlement.total_days && (
          <Progress value={percentage} className="h-2" />
        )}

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => navigate('/holidays/request/new', { 
              state: { holidayTypeId: entitlement.holiday_type.id } 
            })}
          >
            <Calendar className="w-4 h-4 mr-1" />
            Request
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => navigate('/holidays/history', {
              state: { holidayTypeId: entitlement.holiday_type.id }
            })}
          >
            <History className="w-4 h-4 mr-1" />
            History
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}