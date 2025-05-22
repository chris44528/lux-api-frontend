import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, AlertCircle } from "lucide-react";
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import { getFcoList, generateFCOAvailabilityReport } from '@/services/api';
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Types
interface SiteReport {
  name: string;
  availableDays: number;
  totalDays: number;
  availabilityPercentage: number;
  missedDaysPercentage: number;
}

interface YearTabData {
  sites: SiteReport[];
  totalAvailableDays: number;
  totalDays: number;
  overallAvailability: number;
}

interface ReportData {
  [year: string]: YearTabData;
}

interface ApiResponse {
  tabs: ReportData;
  summary: {
    totalSites: number;
    totalDays: number;
    totalAvailableDays: number;
    overallPercentage: number;
    currentYearOnly: boolean;
  };
  error?: string;
}

interface LoadingState {
  fetchingFCOs: boolean;
  generatingReport: boolean;
  loadingAllYears: boolean;
  exportingExcel: boolean;
}

const months = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const FCOReport: React.FC = () => {
  const [fcoList, setFcoList] = useState<string[]>([]);
  const [selectedFco, setSelectedFco] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [loadingState, setLoadingState] = useState<LoadingState>({
    fetchingFCOs: false,
    generatingReport: false,
    loadingAllYears: false,
    exportingExcel: false
  });
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [includeNoComms, setIncludeNoComms] = useState<boolean>(false);
  const [summary, setSummary] = useState<any>(null);
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [isCurrentYearOnly, setIsCurrentYearOnly] = useState<boolean>(true);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchFCOList();
  }, []);

  const fetchFCOList = async () => {
    setLoadingState(prev => ({ ...prev, fetchingFCOs: true }));
    try {
      const data = await getFcoList();
      setFcoList(data.fcos);
    } catch (err) {
      setError('Failed to load FCO list');
      console.error(err);
    } finally {
      setLoadingState(prev => ({ ...prev, fetchingFCOs: false }));
    }
  };

  const generateReport = async () => {
    if (!selectedFco || !selectedMonth) {
      setError('Please select both FCO and month');
      return;
    }
    setLoadingState(prev => ({ ...prev, generatingReport: true }));
    setError(null);
    try {
      const data: ApiResponse = await generateFCOAvailabilityReport({
        fco: selectedFco,
        month: selectedMonth,
        include_no_comms: includeNoComms,
        current_year_only: true // Start with current year only for faster response
      });
      setReportData(data.tabs);
      setSummary(data.summary);
      setIsCurrentYearOnly(data.summary.currentYearOnly);
    } catch (err) {
      setError('Failed to generate report');
      console.error(err);
    } finally {
      setLoadingState(prev => ({ ...prev, generatingReport: false }));
    }
  };
  
  const loadAllYears = async () => {
    if (!selectedFco || !selectedMonth) return;
    
    setLoadingState(prev => ({ ...prev, loadingAllYears: true }));
    try {
      const data: ApiResponse = await generateFCOAvailabilityReport({
        fco: selectedFco,
        month: selectedMonth,
        include_no_comms: includeNoComms,
        current_year_only: false // Get all years
      });
      setReportData(data.tabs);
      setSummary(data.summary);
      setIsCurrentYearOnly(data.summary.currentYearOnly);
    } catch (err) {
      setError('Failed to load all historical data');
      console.error(err);
    } finally {
      setLoadingState(prev => ({ ...prev, loadingAllYears: false }));
    }
  };

  const exportToCSV = async () => {
    if (!selectedFco || !selectedMonth) return;
    
    setLoadingState(prev => ({ ...prev, exportingExcel: true }));
    try {
      await generateFCOAvailabilityReport({
        fco: selectedFco,
        month: selectedMonth,
        download: true,
        include_no_comms: includeNoComms,
        current_year_only: false // Always export all years
      });
    } catch (err) {
      setError('Failed to export report');
      console.error(err);
    } finally {
      setLoadingState(prev => ({ ...prev, exportingExcel: false }));
    }
  };

  // Helper to get summary for the selected year
  const getYearSummary = () => {
    if (!reportData) return null;
    const years = Object.keys(reportData);
    if (years.length === 0) return null;
    const year = years[selectedTabIndex] || years[0];
    const yearData = reportData[year];
    if (!yearData) return null;
    return {
      totalSites: yearData.sites.length,
      totalDays: yearData.totalDays,
      totalAvailableDays: yearData.totalAvailableDays,
      overallPercentage: yearData.overallAvailability,
      year,
    };
  };

  const yearSummary = getYearSummary();

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-7xl px-4 sm:px-6 lg:px-8">
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle>FCO Availability Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <Select value={selectedFco} onValueChange={setSelectedFco}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Select FCO" />
              </SelectTrigger>
              <SelectContent>
                {fcoList.map(fco => (
                  <SelectItem key={fco} value={fco}>{fco}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Select Month" />
              </SelectTrigger>
              <SelectContent>
                {months.map(month => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Checkbox id="include-no-comms" checked={includeNoComms} onCheckedChange={checked => setIncludeNoComms(checked === true)} />
              <label htmlFor="include-no-comms" className="text-sm select-none cursor-pointer">Include No Comms in Available Days</label>
            </div>

            <Button
              onClick={generateReport}
              disabled={loadingState.generatingReport || !selectedFco || !selectedMonth}
              className="w-full md:w-auto"
            >
              {loadingState.generatingReport && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Report
            </Button>

            {reportData && (
              <>
                <Button
                  variant="outline"
                  onClick={exportToCSV}
                  disabled={loadingState.exportingExcel}
                  className="w-full md:w-auto bg-white hover:bg-gray-100 text-gray-800"
                >
                  {loadingState.exportingExcel && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Export to Excel
                </Button>
              
                {isCurrentYearOnly && (
                  <Button
                    variant="secondary"
                    onClick={loadAllYears}
                    disabled={loadingState.loadingAllYears}
                    className="w-full md:w-auto"
                  >
                    {loadingState.loadingAllYears && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Load Historical Data
                  </Button>
                )}
              </>
            )}
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {isCurrentYearOnly && reportData && (
            <Alert className="mt-4 bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-500" />
              <AlertDescription>
                Showing current year data for faster loading. Click "Load Historical Data" for complete history.
              </AlertDescription>
            </Alert>
          )}
          
          {loadingState.generatingReport && (
            <div className="mt-4 py-8 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mr-2" />
              <span>Generating report, please wait...</span>
            </div>
          )}
          
          {loadingState.loadingAllYears && (
            <div className="mt-4 py-8 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mr-2" />
              <span>Loading historical data, this may take a moment...</span>
            </div>
          )}

          {/* Year Summary Box */}
          {yearSummary && (
            <div className="mt-6 mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md flex flex-wrap gap-8 items-center justify-start">
              <div><span className="font-semibold">Year:</span> {yearSummary.year}</div>
              <div><span className="font-semibold">Total Sites:</span> {yearSummary.totalSites}</div>
              <div><span className="font-semibold">Total Days:</span> {yearSummary.totalDays}</div>
              <div><span className="font-semibold">Total Available Days:</span> {yearSummary.totalAvailableDays}</div>
              <div><span className="font-semibold">Overall %:</span> {yearSummary.overallPercentage?.toFixed(2)}%</div>
            </div>
          )}

          {reportData && (
            <Tabs selectedIndex={selectedTabIndex} onSelect={setSelectedTabIndex}>
              <TabList>
                {Object.keys(reportData).map(year => (
                  <Tab key={year}>{year}</Tab>
                ))}
              </TabList>

              {Object.entries(reportData).map(([year, yearData], idx) => (
                <TabPanel key={year}>
                  <table className="w-full mt-6 border-collapse border border-gray-200">
                    <thead>
                    <tr>
                      <th className="border border-gray-300 px-4 py-2">Site Name</th>
                      <th className="border border-gray-300 px-4 py-2">Available Days</th>
                      <th className="border border-gray-300 px-4 py-2">Total Days</th>
                      <th className="border border-gray-300 px-4 py-2">Availability %</th>
                      <th className="border border-gray-300 px-4 py-2">Missed Days %</th>
                    </tr>
                    </thead>
                    <tbody>
                      {yearData.sites.map((site, index) => (
                          <tr key={index}>
                            <td className="border border-gray-300 px-4 py-2">{site.name}</td>
                            <td className="border border-gray-300 px-4 py-2 text-center">{site.availableDays}</td>
                            <td className="border border-gray-300 px-4 py-2 text-center">{site.totalDays}</td>
                            <td className="border border-gray-300 px-4 py-2 text-center">
                              {site.availabilityPercentage.toFixed(1)}%
                            </td>
                            <td className="border border-gray-300 px-4 py-2 text-center">
                              {site.missedDaysPercentage.toFixed(1)}%
                            </td>
                          </tr>
                      ))}
                      {/* Total row for this year */}
                      <tr className="font-semibold bg-gray-50">
                        <td className="border border-gray-300 px-4 py-2">Total</td>
                        <td className="border border-gray-300 px-4 py-2 text-center">{yearData.totalAvailableDays}</td>
                        <td className="border border-gray-300 px-4 py-2 text-center">{yearData.totalDays}</td>
                        <td className="border border-gray-300 px-4 py-2 text-center">{yearData.overallAvailability.toFixed(1)}%</td>
                        <td className="border border-gray-300 px-4 py-2 text-center"></td>
                      </tr>
                    </tbody>
                  </table>
                </TabPanel>
              ))}
            </Tabs>
          )}

        </CardContent>
      </Card>
    </div>
  );
};

export default FCOReport; 