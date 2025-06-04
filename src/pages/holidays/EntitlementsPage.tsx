import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { holidayService, EntitlementSummary } from '@/services/holidayService';
import EntitlementWidget from '@/components/holidays/EntitlementWidget';

export default function EntitlementsPage() {
  const [loading, setLoading] = useState(true);
  const [entitlementSummary, setEntitlementSummary] = useState<EntitlementSummary | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadEntitlements();
  }, [selectedYear]);

  const loadEntitlements = async () => {
    try {
      setLoading(true);
      const summary = await holidayService.getEntitlementSummary(selectedYear);
      setEntitlementSummary(summary);
    } catch (error) {
      console.error('Failed to load entitlements:', error);
    } finally {
      setLoading(false);
    }
  };

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold dark:text-gray-100">My Holiday Entitlements</h1>
        <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map(year => (
              <SelectItem key={year} value={year.toString()} className="dark:text-gray-100 dark:hover:bg-gray-700">{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : entitlementSummary ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {entitlementSummary.entitlements.map((entitlement) => (
              <EntitlementWidget
                key={entitlement.holiday_type.id}
                entitlement={entitlement}
              />
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Entitlement Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p>• Your holiday entitlement is calculated based on your employment contract and company policy.</p>
                  <p>• Unused annual leave may be carried over to the next year subject to company policy.</p>
                  <p>• Pending requests are included in your usage but may be cancelled if not yet approved.</p>
                  <p>• Public holidays are not deducted from your annual leave allowance.</p>
                </div>

                {entitlementSummary.entitlements.some(e => e.holiday_type.code === 'AL' && e.days_remaining && e.days_remaining > 0) && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mt-4">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Carry Over Policy</h4>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      You may carry over up to 5 days of unused annual leave to the next year. 
                      Carried over days must be used within the first 3 months of the new year.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">No entitlement data available for {selectedYear}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}