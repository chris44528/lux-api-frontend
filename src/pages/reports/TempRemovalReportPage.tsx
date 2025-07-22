import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { Download, Calendar, MapPin, Search, Filter, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';
import tempRemovalService, { TempRemoval, TempRemovalReport } from '../../services/tempRemovalService';
import { searchSites } from '../../services/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF type for autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

interface SiteSearchResult {
  Site_id?: number;
  site_id?: number;
  Site_Name?: string;
  site_name?: string;
  site_reference?: string;
  postcode?: string;
  address?: string;
}

const TempRemovalReportPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<TempRemovalReport | null>(null);
  
  // Filters
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [selectedSite, setSelectedSite] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'removed' | 'refitted'>('all');
  const [siteSearchTerm, setSiteSearchTerm] = useState('');
  const [siteSearchResults, setSiteSearchResults] = useState<SiteSearchResult[]>([]);
  const [isSearchingSite, setIsSearchingSite] = useState(false);
  const [showSiteDropdown, setShowSiteDropdown] = useState(false);

  // Generate report
  const generateReport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters: any = {};
      if (selectedSite) {
        filters.site = selectedSite;
      }
      if (selectedStatus !== 'all') {
        filters.status = selectedStatus;
      }
      
      const data = await tempRemovalService.generateReport(startDate, endDate, filters);
      setReportData(data);
    } catch (err) {
      setError('Failed to generate report. Please try again.');
      console.error('Error generating report:', err);
    } finally {
      setLoading(false);
    }
  };

  // Search sites
  useEffect(() => {
    const searchTimer = setTimeout(async () => {
      if (siteSearchTerm.length >= 2) {
        setIsSearchingSite(true);
        try {
          const results = await searchSites(siteSearchTerm);
          setSiteSearchResults(results);
        } catch (err) {
          console.error('Site search error:', err);
        } finally {
          setIsSearchingSite(false);
        }
      } else {
        setSiteSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(searchTimer);
  }, [siteSearchTerm]);

  // Export to PDF
  const exportToPDF = () => {
    if (!reportData) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Header
    doc.setFontSize(20);
    doc.text('Temporary Removal Report', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Report Period: ${format(new Date(startDate), 'dd/MM/yyyy')} - ${format(new Date(endDate), 'dd/MM/yyyy')}`, pageWidth / 2, 30, { align: 'center' });
    
    // Summary
    doc.setFontSize(14);
    doc.text('Summary', 14, 45);
    
    doc.setFontSize(10);
    const summaryData = [
      ['Total Removals:', reportData.summary.total_removals.toString()],
      ['Currently Removed:', reportData.summary.currently_removed.toString()],
      ['Refitted:', reportData.summary.refitted_count.toString()],
      ['Average Days Removed:', reportData.summary.average_days_removed.toFixed(1)],
      ['Sites Affected:', reportData.summary.sites_affected.toString()],
    ];
    
    let y = 55;
    summaryData.forEach(([label, value]) => {
      doc.text(label, 14, y);
      doc.text(value, 70, y);
      y += 7;
    });
    
    // Table
    if (reportData.removals.length > 0) {
      doc.setFontSize(14);
      doc.text('Removal Details', 14, y + 10);
      
      const tableData = reportData.removals.map(removal => {
        const site = typeof removal.site === 'object' ? removal.site : null;
        return [
          site?.site_reference || 'N/A',
          site?.site_name || 'N/A',
          format(new Date(removal.removal_date), 'dd/MM/yyyy'),
          removal.refit_date ? format(new Date(removal.refit_date), 'dd/MM/yyyy') : 'Not refitted',
          removal.days_removed?.toString() || '0',
          removal.job_number || '-',
          removal.notes || '-'
        ];
      });
      
      doc.autoTable({
        startY: y + 15,
        head: [['Site Ref', 'Site Name', 'Removal Date', 'Refit Date', 'Days Out', 'Job #', 'Notes']],
        body: tableData,
        theme: 'striped',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [34, 197, 94] },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 35 },
          2: { cellWidth: 25 },
          3: { cellWidth: 25 },
          4: { cellWidth: 20 },
          5: { cellWidth: 25 },
          6: { cellWidth: 'auto' }
        }
      });
    }
    
    // Footer
    const pageCount = doc.internal.pages.length - 1;
    doc.setFontSize(8);
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
      doc.text(`Generated on ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, doc.internal.pageSize.height - 10);
    }
    
    // Save
    doc.save(`temp-removal-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  // Export to CSV
  const exportToCSV = async () => {
    try {
      const filters: any = {
        removal_date__gte: startDate,
        removal_date__lte: endDate,
      };
      
      if (selectedSite) {
        filters.site = selectedSite;
      }
      if (selectedStatus !== 'all') {
        filters.status = selectedStatus;
      }
      
      const blob = await tempRemovalService.exportToCsv(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `temp-removals-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to export CSV. Please try again.');
      console.error('Error exporting CSV:', err);
    }
  };

  // Quick date presets
  const setDatePreset = (preset: string) => {
    const now = new Date();
    switch (preset) {
      case 'thisMonth':
        setStartDate(format(startOfMonth(now), 'yyyy-MM-dd'));
        setEndDate(format(endOfMonth(now), 'yyyy-MM-dd'));
        break;
      case 'lastMonth':
        const lastMonth = subMonths(now, 1);
        setStartDate(format(startOfMonth(lastMonth), 'yyyy-MM-dd'));
        setEndDate(format(endOfMonth(lastMonth), 'yyyy-MM-dd'));
        break;
      case 'last3Months':
        setStartDate(format(subMonths(now, 3), 'yyyy-MM-dd'));
        setEndDate(format(now, 'yyyy-MM-dd'));
        break;
      case 'last6Months':
        setStartDate(format(subMonths(now, 6), 'yyyy-MM-dd'));
        setEndDate(format(now, 'yyyy-MM-dd'));
        break;
      case 'thisYear':
        setStartDate(format(new Date(now.getFullYear(), 0, 1), 'yyyy-MM-dd'));
        setEndDate(format(new Date(now.getFullYear(), 11, 31), 'yyyy-MM-dd'));
        break;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Temporary Removal Report</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Generate reports for temporary meter removals and refits
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium mb-2">Date Range</label>
              <div className="flex flex-wrap gap-2 mb-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDatePreset('thisMonth')}
                >
                  This Month
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDatePreset('lastMonth')}
                >
                  Last Month
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDatePreset('last3Months')}
                >
                  Last 3 Months
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDatePreset('last6Months')}
                >
                  Last 6 Months
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDatePreset('thisYear')}
                >
                  This Year
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                  />
                </div>
              </div>
            </div>

            {/* Site Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Site (Optional)</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for a site..."
                  value={siteSearchTerm}
                  onChange={(e) => {
                    setSiteSearchTerm(e.target.value);
                    setShowSiteDropdown(true);
                  }}
                  onFocus={() => setShowSiteDropdown(true)}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                />
                {selectedSite && (
                  <button
                    onClick={() => {
                      setSelectedSite(null);
                      setSiteSearchTerm('');
                    }}
                    className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                )}
                {showSiteDropdown && siteSearchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
                    {siteSearchResults.map((site) => {
                      const siteId = site.Site_id || site.site_id;
                      const siteName = site.Site_Name || site.site_name || '';
                      return (
                        <button
                          key={siteId}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => {
                            setSelectedSite(siteId!);
                            setSiteSearchTerm(`${site.site_reference} - ${siteName}`);
                            setShowSiteDropdown(false);
                          }}
                        >
                          <div>
                            <span className="font-medium">{site.site_reference}</span> - {siteName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {site.address}, {site.postcode}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <Select value={selectedStatus} onValueChange={(value: any) => setSelectedStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="removed">Currently Removed</SelectItem>
                  <SelectItem value="refitted">Refitted</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Generate Button */}
            <div className="flex justify-end">
              <Button onClick={generateReport} disabled={loading}>
                {loading ? 'Generating...' : 'Generate Report'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Report Results */}
      {reportData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold">{reportData.summary.total_removals}</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Removals</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-orange-600">
                  {reportData.summary.currently_removed}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Currently Removed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-green-600">
                  {reportData.summary.refitted_count}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Refitted</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold">
                  {reportData.summary.average_days_removed.toFixed(1)}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Days Out</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold">{reportData.summary.sites_affected}</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Sites Affected</p>
              </CardContent>
            </Card>
          </div>

          {/* Data Table */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Removal Details</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={exportToCSV}>
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportToPDF}>
                    <FileText className="w-4 h-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {reportData.removals.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No removal records found for the selected criteria
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b dark:border-gray-700">
                        <th className="text-left py-3 px-4">Site Reference</th>
                        <th className="text-left py-3 px-4">Site Name</th>
                        <th className="text-left py-3 px-4">Removal Date</th>
                        <th className="text-left py-3 px-4">Refit Date</th>
                        <th className="text-left py-3 px-4">Days Out</th>
                        <th className="text-left py-3 px-4">Job Number</th>
                        <th className="text-left py-3 px-4">Status</th>
                        <th className="text-left py-3 px-4">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.removals.map((removal) => {
                        const site = typeof removal.site === 'object' ? removal.site : null;
                        return (
                          <tr key={removal.id} className="border-b dark:border-gray-700">
                            <td className="py-3 px-4">{site?.site_reference || 'N/A'}</td>
                            <td className="py-3 px-4">{site?.site_name || 'N/A'}</td>
                            <td className="py-3 px-4">
                              {format(new Date(removal.removal_date), 'dd/MM/yyyy')}
                            </td>
                            <td className="py-3 px-4">
                              {removal.refit_date
                                ? format(new Date(removal.refit_date), 'dd/MM/yyyy')
                                : '-'}
                            </td>
                            <td className="py-3 px-4">{removal.days_removed || 0}</td>
                            <td className="py-3 px-4">{removal.job_number || '-'}</td>
                            <td className="py-3 px-4">
                              <Badge variant={removal.is_refitted ? 'secondary' : 'default'}>
                                {removal.is_refitted ? 'Refitted' : 'Removed'}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 max-w-xs truncate" title={removal.notes}>
                              {removal.notes || '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default TempRemovalReportPage;