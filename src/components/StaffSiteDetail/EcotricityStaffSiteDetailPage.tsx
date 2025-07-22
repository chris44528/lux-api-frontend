import React, { useState, useEffect } from 'react';
import EcotricityActionsDropdown from './EcotricityActionsDropdown';
import { useParams } from 'react-router-dom';
import { getSiteDetail, startMeterTest, pollMeterTestStatus } from '../../services/api';
import LinearProgress from '@mui/material/LinearProgress';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CloseIcon from '@mui/icons-material/Close';

interface Reading {
  date: string;
  meter_reading?: string;
  value?: string;
  generation?: string;
  generation_increase?: string;
}

interface MeterTest {
  id?: number;
  test_reading?: string;
  test_date?: string;
  signal_level?: string;
}

interface SiteDetailApiResponse {
  site?: Record<string, unknown>;
  customer?: Record<string, unknown>;
  meters?: unknown[];
  active_meter?: Record<string, unknown> & { meter_serial?: string };
  sim?: Record<string, unknown> & { sim_num?: string };
  readings?: Reading[];
  meter_tests?: MeterTest[];
}

// Helper to get user-friendly status messages
const getDisplayStatus = (status: string): string => {
  switch (status) {
    case 'pending':
      return 'Initializing meter test...';
    case 'processing':
      return 'Reading meter data... (this may take up to 60 seconds)';
    case 'completed':
      return 'Meter test completed successfully!';
    case 'error':
      return 'Meter test failed';
    case 'Starting meter test...':
      return 'Starting meter test...';
    default:
      return status || 'Testing meter, please wait...';
  }
};

// OBIS code mapping
const OBIS_MAP: Record<string, string> = {
  '1.0.1.8.0.255': 'Total Active Energy Import (kWh)',
  '1.0.32.7.0.255': 'Voltage L1 (V)',
  '1.0.52.7.0.255': 'Voltage L2 (V)',
  '1.0.72.7.0.255': 'Voltage L3 (V)',
  '1.0.31.7.0.255': 'Current L1 (A)',
  '1.0.51.7.0.255': 'Current L2 (A)',
  '1.0.71.7.0.255': 'Current L3 (A)',
  '0.0.96.1.0.255': 'Meter Serial Number',
  '0.0.1.0.0.255': 'Meter Date/Time',
  '0.0.128.20.0.255': 'GSM Signal',
};

const EcotricityStaffSiteDetailPage: React.FC = () => {
  const { siteId } = useParams<{ siteId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [siteData, setSiteData] = useState<SiteDetailApiResponse | null>(null);
  const [meterTestLoading, setMeterTestLoading] = useState(false);
  const [meterTestStatus, setMeterTestStatus] = useState('');
  const [meterTestResult, setMeterTestResult] = useState<Record<string, unknown> | null>(null);
  const [meterTestError, setMeterTestError] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [showResultBar, setShowResultBar] = useState(false);
  const resultTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  
  // Pagination state for meter tests
  const [currentPage, setCurrentPage] = useState(1);
  const testsPerPage = 8;

  useEffect(() => {
    async function fetchSiteData() {
      setLoading(true);
      try {
        if (siteId) {
          const data = await getSiteDetail(siteId.toString());
          setSiteData(data);
        }
      } catch {
        setError('Failed to load site data');
      } finally {
        setLoading(false);
      }
    }
    if (siteId) fetchSiteData();
  }, [siteId]);

  const handleTestMeter = async () => {
    setMeterTestLoading(true);
    setMeterTestStatus('Starting meter test...');
    setMeterTestResult(null);
    setMeterTestError('');
    setShowResultBar(true);
    setShowDetails(false);
    if (resultTimeoutRef.current) clearTimeout(resultTimeoutRef.current);

    try {
      if (!siteData || !siteData.active_meter) {
        setMeterTestError('No meter data available.');
        setMeterTestLoading(false);
        setShowResultBar(true);
        return;
      }
      // Use SIM IP for meter test
      const meterIp = String(siteData.sim?.sim_ip ?? '');
      const meterModel = String(siteData.active_meter.meter_model ?? '');
      const meterPassword = String(siteData.active_meter.meter_password ?? '');
      const site_id = siteId;

      if (!meterIp || !meterModel || !meterPassword || !site_id) {
        setMeterTestError('Missing meter information.');
        setMeterTestLoading(false);
        setShowResultBar(true);
        return;
      }

      const { task_id } = await startMeterTest({
        ip: meterIp,
        model: meterModel,
        password: meterPassword,
        site_id: Number(site_id),
      });

      await pollMeterTestStatus(
        task_id,
        async (statusResponse) => {
          setMeterTestStatus(statusResponse.status);
          
          // Handle completed status - this is when we have real data
          if (statusResponse.status === 'completed') {
            setMeterTestResult(statusResponse.result ?? null);
            setMeterTestLoading(false);
            setShowResultBar(true);
            
            // Refresh site data to update Meter Test History
            if (siteId) {
              const data = await getSiteDetail(siteId.toString());
              setSiteData(data);
            }
            
            // Start timeout to auto-hide result bar if details not shown
            if (!showDetails) {
              if (resultTimeoutRef.current) clearTimeout(resultTimeoutRef.current);
              resultTimeoutRef.current = setTimeout(() => {
                setShowResultBar(false);
              }, 25000);
            }
          }
          
          // Handle error status
          if (statusResponse.status === 'error') {
            setMeterTestError(statusResponse.error || 'Unknown error');
            setMeterTestLoading(false);
            setShowResultBar(true);
          }
          
          // Keep showing progress for pending/processing status
          if (statusResponse.status === 'pending' || statusResponse.status === 'processing') {
            setMeterTestLoading(true);
            setShowResultBar(true);
          }
        }
      );
    } catch {
      setMeterTestError('Failed to start meter test');
      setShowResultBar(true);
    } finally {
      setMeterTestLoading(false);
    }
  };

  // Handle show/hide details and timeout logic
  const handleShowDetails = () => {
    setShowDetails((v) => {
      const newVal = !v;
      if (newVal) {
        // Pause auto-hide when details are shown
        if (resultTimeoutRef.current) clearTimeout(resultTimeoutRef.current);
      } else {
        // Restart timeout when details are hidden
        if (resultTimeoutRef.current) clearTimeout(resultTimeoutRef.current);
        resultTimeoutRef.current = setTimeout(() => {
          setShowResultBar(false);
        }, 25000);
      }
      return newVal;
    });
  };
  
  const handleCloseResultBar = () => {
    setShowResultBar(false);
    setShowDetails(false);
    if (resultTimeoutRef.current) clearTimeout(resultTimeoutRef.current);
  };

  // Compute last reading and last reading date
  let lastReading = siteData?.site?.last_reading || '';
  let lastReadingDate = siteData?.site?.last_reading_date || '';
  if ((!lastReading || !lastReadingDate) && siteData?.readings && siteData.readings.length > 0) {
    // Sort readings by date descending
    const sorted = [...siteData.readings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const latest = sorted[0];
    if (latest) {
      if (!lastReading && latest.meter_reading) {
        const val = parseFloat(latest.meter_reading);
        lastReading = isNaN(val) ? latest.meter_reading : `${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kWh`;
      }
      if (!lastReadingDate && latest.date) {
        const d = new Date(latest.date);
        lastReadingDate = d.toLocaleDateString('en-GB');
      }
    }
  }

  if (loading) return <div className="p-8 text-center bg-white dark:bg-gray-900 dark:text-gray-100">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500 bg-white dark:bg-gray-900 dark:text-red-400">{error}</div>;
  if (!siteData) return <div className="p-8 text-center text-red-500 bg-white dark:bg-gray-900 dark:text-red-400">No site data found.</div>;

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 dark:text-gray-100">
        {/* Header with site name and actions */}
        <div className="flex items-center justify-between px-8 py-4 border-b bg-white dark:bg-gray-800 dark:border-gray-700 gap-4 relative">
          {/* Site name (center) */}
          <div className="flex-1 flex justify-center items-center min-w-0">
            <h1 className="text-2xl font-bold text-center truncate text-gray-900 dark:text-gray-100">Site Name: {String(siteData.site?.site_name || '')}</h1>
          </div>
          {/* Actions menu (right) */}
          <div className="flex-shrink-0">
            <EcotricityActionsDropdown onTestMeter={handleTestMeter} />
          </div>
        </div>
        
        {/* Meter Test Progress/Result UI below header */}
        {showResultBar && (meterTestLoading || meterTestResult || meterTestError) && (
          <div className="flex flex-col items-center gap-4 px-8 mt-6 bg-white dark:bg-gray-900 dark:text-gray-100">
            {meterTestLoading && (
              <div className="w-full max-w-xl flex flex-col items-center">
                <LinearProgress
                  variant="indeterminate"
                  style={{ height: 16, borderRadius: 8 }}
                  color="primary"
                  className="dark:bg-gray-700"
                />
                <div className="mt-4 text-base text-gray-700 dark:text-gray-200 font-semibold animate-pulse">
                  {getDisplayStatus(meterTestStatus)}
                </div>
              </div>
            )}
            {meterTestResult && (() => {
              const obis = meterTestResult ? (meterTestResult as unknown as Record<string, Record<string, unknown>>) : {};
              const obisVal = obis['1.0.1.8.0.255'] as Record<string, unknown> ?? {};
              const value = Number(obisVal.value ?? 0);
              // No scaling, value is already in kWh
              const isSuccess = value && meterTestStatus !== 'error';
              return (
                <div className="w-full max-w-xl flex flex-col items-center relative">
                  <LinearProgress
                    variant="determinate"
                    value={100}
                    style={{ height: 16, borderRadius: 8, background: isSuccess ? '#e6f4ea' : '#fdecea' }}
                    color={isSuccess ? 'success' : 'error'}
                    className="dark:opacity-90"
                  />
                  <div className={`mt-4 flex items-center gap-2 text-lg font-semibold ${isSuccess ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}
                  >
                    {isSuccess ? <CheckCircleIcon color="success" /> : <ErrorIcon color="error" />}
                    {isSuccess
                      ? `Meter test successful! Reading: ${value.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })} kWh`
                      : 'Meter test failed. See details below.'
                    }
                  </div>
                  
                  <div className="self-stretch flex justify-between items-center mt-4">
                    <button
                      className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      onClick={handleShowDetails}
                    >
                      {showDetails ? (
                        <>
                          Hide Details <ExpandLessIcon fontSize="small" />
                        </>
                      ) : (
                        <>
                          Show Details <ExpandMoreIcon fontSize="small" />
                        </>
                      )}
                    </button>
                    <button
                      className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                      onClick={handleCloseResultBar}
                    >
                      <CloseIcon fontSize="small" /> Dismiss
                    </button>
                  </div>
                </div>
              );
            })()}
            {meterTestError && (
              <div className="w-full max-w-xl flex flex-col items-center relative">
                <LinearProgress
                  variant="determinate"
                  value={100}
                  style={{ height: 16, borderRadius: 8, background: '#fdecea' }}
                  color="error"
                  className="dark:opacity-90"
                />
                <div className="mt-4 flex items-center gap-2 text-lg font-semibold text-red-700 dark:text-red-400">
                  <ErrorIcon color="error" />
                  Meter test failed
                </div>
                <div className="mt-2 text-red-600 dark:text-red-400">{meterTestError}</div>
                <div className="self-stretch flex justify-end items-center mt-4">
                  <button
                    className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    onClick={handleCloseResultBar}
                  >
                    <CloseIcon fontSize="small" /> Dismiss
                  </button>
                </div>
              </div>
            )}
            {showDetails && meterTestResult && (
              <div className="w-full max-w-xl mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-3 dark:text-gray-100">Meter Test Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(meterTestResult).map(([code, data]) => {
                    const displayData = data as Record<string, unknown>;
                    return (
                      <div key={code} className="p-3 bg-white dark:bg-gray-700 rounded shadow-sm border dark:border-gray-600">
                        <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">{OBIS_MAP[code] || code}</div>
                        <div className="mt-1 text-lg font-medium dark:text-gray-100">{String(displayData.value || '—')}</div>
                        {displayData.timestamp && (
                          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {new Date(displayData.timestamp as string).toLocaleString()}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Simplified Content with only the required sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
          {/* Site Details (Col 1) */}
          <div className="col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">SITE DETAILS</h2>
            <div className="space-y-4">
              <div>
                <div className="font-semibold dark:text-gray-300">Site Name:</div>
                <div className="dark:text-gray-400">{String(siteData.site?.site_name || '—')}</div>
              </div>
              <div>
                <div className="font-semibold dark:text-gray-300">Address:</div>
                <div className="dark:text-gray-400">{String(siteData.site?.address || '—')}</div>
              </div>
              <div>
                <div className="font-semibold dark:text-gray-300">Postcode:</div>
                <div className="dark:text-gray-400">{String(siteData.site?.postcode || '—')}</div>
              </div>
              <div>
                <div className="font-semibold dark:text-gray-300">Account:</div>
                <div className="dark:text-gray-400">Ecotricity</div>
              </div>
              <div>
                <div className="font-semibold dark:text-gray-300">Last Reading:</div>
                <div className="dark:text-gray-400">{lastReading || '—'}</div>
              </div>
              <div>
                <div className="font-semibold dark:text-gray-300">Last Reading Date:</div>
                <div className="dark:text-gray-400">{lastReadingDate || '—'}</div>
              </div>
            </div>
          </div>

          {/* Meter Test History (Col 2) */}
          <div className="col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">METER TEST HISTORY</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Meter Reading</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Test Date</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Signal Level</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {(() => {
                    if (!siteData.meter_tests || siteData.meter_tests.length === 0) {
                      return (
                        <tr>
                          <td colSpan={3} className="px-2 py-3 text-center dark:text-gray-400">No test history available</td>
                        </tr>
                      );
                    }
                    
                    const totalPages = Math.ceil(siteData.meter_tests.length / testsPerPage);
                    const indexOfLastTest = currentPage * testsPerPage;
                    const indexOfFirstTest = indexOfLastTest - testsPerPage;
                    const currentTests = siteData.meter_tests.slice(indexOfFirstTest, indexOfLastTest);
                    
                    return currentTests.map((test, index) => (
                      <tr key={test.id || index} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'}>
                        <td className="px-2 py-3 whitespace-nowrap dark:text-gray-300">{test.test_reading || '—'}</td>
                        <td className="px-2 py-3 whitespace-nowrap dark:text-gray-300">{test.test_date ? new Date(test.test_date).toLocaleString() : '—'}</td>
                        <td className="px-2 py-3 whitespace-nowrap dark:text-gray-300">{test.signal_level || '—'}</td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
              
              {/* Pagination controls */}
              {siteData.meter_tests && siteData.meter_tests.length > testsPerPage && (
                <div className="flex items-center justify-between mt-4 px-2">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Showing {((currentPage - 1) * testsPerPage) + 1} to {Math.min(currentPage * testsPerPage, siteData.meter_tests.length)} of {siteData.meter_tests.length} tests
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className={`px-3 py-1 text-sm rounded border ${
                        currentPage === 1
                          ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500 dark:border-gray-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700'
                      }`}
                    >
                      Previous
                    </button>
                    
                    {/* Page numbers */}
                    <div className="flex items-center space-x-1">
                      {(() => {
                        const totalPages = Math.ceil(siteData.meter_tests.length / testsPerPage);
                        return Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                          if (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          ) {
                            return (
                              <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`px-3 py-1 text-sm rounded ${
                                  page === currentPage
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700'
                                }`}
                              >
                                {page}
                              </button>
                            );
                          } else if (
                            page === currentPage - 2 || 
                            page === currentPage + 2
                          ) {
                            return <span key={page} className="text-gray-500 dark:text-gray-400">...</span>;
                          }
                          return null;
                        });
                      })()}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(siteData.meter_tests.length / testsPerPage)))}
                      disabled={currentPage === Math.ceil(siteData.meter_tests.length / testsPerPage)}
                      className={`px-3 py-1 text-sm rounded border ${
                        currentPage === Math.ceil(siteData.meter_tests.length / testsPerPage)
                          ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500 dark:border-gray-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Installed Meter & SIM Details (Col 3) */}
          <div className="col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">INSTALLED METER & SIM DETAILS</h2>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2 dark:text-gray-200">Meter Details</h3>
              <div className="space-y-2">
                <div>
                  <div className="font-semibold dark:text-gray-300">Meter Serial:</div>
                  <div className="dark:text-gray-400">{String(siteData.active_meter?.meter_serial || '—')}</div>
                </div>
                <div>
                  <div className="font-semibold dark:text-gray-300">Meter Model:</div>
                  <div className="dark:text-gray-400">{String(siteData.active_meter?.meter_model || '—')}</div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 dark:text-gray-200">SIM Details</h3>
              <div className="space-y-2">
                <div>
                  <div className="font-semibold dark:text-gray-300">SIM Number:</div>
                  <div className="dark:text-gray-400">{String(siteData.sim?.sim_num || '—')}</div>
                </div>
                <div>
                  <div className="font-semibold dark:text-gray-300">SIM IP:</div>
                  <div className="dark:text-gray-400">{String(siteData.sim?.sim_ip || '—')}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Latest Readings (Full Width) */}
          <div className="col-span-1 md:col-span-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">LATEST READINGS (Last 30 Days)</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Meter Reading</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Daily Generation</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {siteData.readings && siteData.readings.length > 0 ? (
                    // Sort readings by date descending
                    [...siteData.readings]
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 30) // Limit to 30 days
                      .map((reading, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'}>
                          <td className="px-4 py-3 whitespace-nowrap dark:text-gray-300">
                            {new Date(reading.date).toLocaleDateString('en-GB')}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap dark:text-gray-300">
                            {reading.meter_reading ? parseFloat(reading.meter_reading).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap dark:text-gray-300">
                            {reading.generation ? parseFloat(reading.generation).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-center dark:text-gray-400">No readings available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EcotricityStaffSiteDetailPage; 