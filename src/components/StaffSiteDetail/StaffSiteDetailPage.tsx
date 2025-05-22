import React, { useState, useEffect } from 'react';
import SiteLandlordCard from './SiteLandlordCard';
import ActionsDropdown from './ActionsDropdown';
import ReadingsTab from './ReadingsTab';
import MeterInfoTab from './MeterInfoTab';
import CallsTab from './CallsTab';
import JobsTab from './JobsTab';
import SystemNotesTable from './SystemNotesTable';
import { useParams, useNavigate } from 'react-router-dom';
import { getSiteDetail, createNote, api, startMeterTest, pollMeterTestStatus, searchSites } from '../../services/api';
import LinearProgress from '@mui/material/LinearProgress';
import Alert from '@mui/material/Alert';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CloseIcon from '@mui/icons-material/Close';
import ChangeSimModal from '../ChangeSimModal';
import ChangeMeterModal from '../ChangeMeterModal';
import CompareReadingsModal from '../CompareReadingsModal';
import AddAlertModal from '../AddAlertModal';
import AlertBanner from '../AlertBanner';
import EditAlertModal from '../EditAlertModal';
import MeterHistoryModal from '../MeterHistoryModal';
import ManageAlertsModal from '../ManageAlertsModal';
import { SiteAlert, Meter } from '../../services/api';
import { Search } from 'lucide-react';
import { debounce } from 'lodash';
import TextMessageModal from '../TextMessageModal';
import SiteReadingReportModal from '../SiteReadingReportModal';
import AdvancedMonitoringModal from '../AdvancedMonitoringModal';

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
interface CallRecord {
  id: string;
  caller: string;
  phone: string;
  date: string;
  time: string;
  duration: string;
  type: 'Inbound' | 'Outbound';
  status: 'Completed' | 'Missed';
}
interface Note {
  id: number;
  date: string;
  department: string;
  note: string;
  author: string;
  favorite: boolean;
  tag?: string;
}
interface SiteDetailApiResponse {
  site?: Record<string, unknown>;
  customer?: Record<string, unknown>;
  meters?: unknown[];
  active_meter?: Record<string, unknown> & { meter_serial?: string };
  sim?: Record<string, unknown> & { sim_num?: string };
  readings?: Reading[];
  meter_tests?: MeterTest[];
  calls?: CallRecord[];
  notes?: Note[];
  active_alerts?: SiteAlert[];
}

interface ApiNote {
  id: number;
  notes?: string;
  note_author?: string;
  department?: { name?: string } | null;
  note_date?: string;
  is_favorite?: boolean;
}

// Helper to map API note to UI note
const mapApiNoteToUiNote = (apiNote: ApiNote) => ({
  id: apiNote.id,
  note: apiNote.notes || '',
  author: apiNote.note_author || '',
  department: apiNote.department?.name || '—',
  date: apiNote.note_date ? new Date(apiNote.note_date).toLocaleDateString() : '',
  favorite: apiNote.is_favorite || false,
  tag: apiNote.department?.name || undefined,
});

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

// Add this type for search results
interface SiteSearchResult {
  Site_id?: number;
  site_id?: number;
  Site_Name?: string;
  site_name?: string;
  id?: string;
  lastVisited?: string;
  postcode?: string;
  address?: string;
}

const StaffSiteDetailPage: React.FC = () => {
  const { siteId } = useParams<{ siteId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('readings');
  const [siteData, setSiteData] = useState<SiteDetailApiResponse | null>(null);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);
  const [noteContent, setNoteContent] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null);
  const [noteImage, setNoteImage] = useState<File | null>(null);
  const [noteLoading, setNoteLoading] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);
  const [meterTestLoading, setMeterTestLoading] = useState(false);
  const [meterTestStatus, setMeterTestStatus] = useState('');
  const [meterTestResult, setMeterTestResult] = useState<Record<string, unknown> | null>(null);
  const [meterTestError, setMeterTestError] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [showResultBar, setShowResultBar] = useState(false);
  const resultTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const [notesTableKey, setNotesTableKey] = useState(0);
  const [showChangeSim, setShowChangeSim] = useState(false);
  const [showChangeMeter, setShowChangeMeter] = useState(false);
  const [showCompareReadings, setShowCompareReadings] = useState(false);
  const [showAddAlert, setShowAddAlert] = useState(false);
  const [showEditAlert, setShowEditAlert] = useState(false);
  const [showMeterHistory, setShowMeterHistory] = useState(false);
  const [showManageAlerts, setShowManageAlerts] = useState(false);
  const [alertToEdit, setAlertToEdit] = useState<SiteAlert | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SiteSearchResult[]>([]);
  const [showTextMessageModal, setShowTextMessageModal] = useState(false);
  const [showSiteReadingReportModal, setShowSiteReadingReportModal] = useState(false);
  const [showAdvancedMonitoringModal, setShowAdvancedMonitoringModal] = useState(false);

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

  // Fetch departments when modal opens
  useEffect(() => {
    if (showAddNoteModal) {
      api.get('/departments/')
        .then(res => {
          if (Array.isArray(res.data)) setDepartments(res.data);
          else if (res.data && Array.isArray(res.data.results)) setDepartments(res.data.results);
          else setDepartments([]);
        })
        .catch(() => setDepartments([]));
    }
  }, [showAddNoteModal]);

  // Add note handler
  const handleSaveNote = async () => {
    if (!selectedDepartment || !noteContent.trim()) {
      setNoteError('Please select a department and enter note content.');
      return;
    }
    setNoteLoading(true);
    setNoteError(null);
    try {
      await createNote(siteId!, {
        note: noteContent,
        image: noteImage || undefined,
        department_id: selectedDepartment,
      });
      setShowAddNoteModal(false);
      setNoteContent('');
      setSelectedDepartment(null);
      setNoteImage(null);
      // Refresh site data/notes here
      if (siteId) {
        const data = await getSiteDetail(siteId.toString());
        setSiteData(data);
        setNotesTableKey(Date.now()); // force SystemNotesTable to re-render
      }
    } catch {
      setNoteError('Failed to save note.');
    } finally {
      setNoteLoading(false);
    }
  };

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
          console.log('Meter test status update:', statusResponse.status, statusResponse);
          setMeterTestStatus(statusResponse.status);
          
          // Handle completed status - this is when we have real data
          if (statusResponse.status === 'completed') {
            setMeterTestResult(statusResponse.result ?? null);
            setMeterTestLoading(false);
            setShowResultBar(true);
            
            // Save the test attempt to backend
            try {
              const obis = statusResponse.result ? (statusResponse.result as unknown as Record<string, unknown>) : {};
              const obisVal = obis['1.0.1.8.0.255'] as Record<string, unknown> ?? {};
              const value = Number(obisVal.value ?? 0);
              
              console.log('Saving meter test result:', { value, obis });
              
              await api.post('/meter-test/', {
                site_id: Number(site_id),
                meter_model: meterModel,
                test_reading: value.toFixed(4),
                test_date: new Date().toISOString(),
                signal_level: statusResponse.result?.['0.0.128.20.0.255']?.value ?? '',
              });
              
              // Refresh site data to update Meter Test History
              if (siteId) {
                const data = await getSiteDetail(siteId.toString());
                setSiteData(data);
              }
            } catch (saveError) {
              console.error('Error saving meter test result:', saveError);
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

  // Debounced search function
  const debouncedSearch = React.useCallback(
    debounce(async (term: string) => {
      if (!term || term.length < 2) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }
      setIsSearching(true);
      try {
        const response = await searchSites(term);
        if (response && response.results) {
          setSearchResults(response.results.slice(0, 3));
        } else {
          setSearchResults([]);
        }
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (term.length >= 2) {
      debouncedSearch(term);
    } else {
      setSearchResults([]);
    }
  };

  const handleSiteClick = (site: SiteSearchResult) => {
    const siteIdVal = site.Site_id || site.site_id || site.id;
    if (siteIdVal) {
      navigate(`/site/${siteIdVal}`);
    }
  };

  if (loading) return <div className="p-8 text-center bg-white dark:bg-gray-900 dark:text-gray-100">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500 bg-white dark:bg-gray-900 dark:text-red-400">{error}</div>;
  if (!siteData) return <div className="p-8 text-center text-red-500 bg-white dark:bg-gray-900 dark:text-red-400">No site data found.</div>;

  // Show site alerts at the very top
  const alertBanner = (
    <AlertBanner
      alerts={Array.isArray(siteData.active_alerts) ? siteData.active_alerts : []}
      onAddAlert={() => setShowAddAlert(true)}
      onManageAlerts={() => setShowManageAlerts(true)}
    />
  );

  return (
    <>
      {alertBanner}
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 dark:text-gray-100">
        {/* Header with search, site name, and actions */}
        <div className="flex items-center justify-between px-8 py-4 border-b bg-white dark:bg-gray-800 dark:border-gray-700 gap-4 relative">
          {/* Search box (left) */}
          <div className="relative w-72 max-w-xs flex-shrink-0">
            <input
              type="text"
              placeholder="Search sites..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            {searchTerm.length > 0 && searchTerm.length < 2 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Enter at least 2 characters to search</p>
            )}
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg z-50">
                <ul>
                  {searchResults.map((site) => (
                    <li
                      key={site.Site_id || site.site_id || site.id}
                      className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => handleSiteClick(site)}
                    >
                      <div className="font-medium text-blue-600 dark:text-blue-400">{site.Site_Name || site.site_name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-300">
                        {site.postcode ? `${site.address || ''} ${site.postcode}` : 'ID: ' + (site.Site_id || site.site_id || site.id)}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {isSearching && (
              <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg z-50 px-4 py-2 text-center text-gray-500 dark:text-gray-300">
                Searching...
              </div>
            )}
          </div>
          {/* Site name (center) */}
          <div className="flex-1 flex justify-center items-center min-w-0">
            <h1 className="text-2xl font-bold text-center truncate text-gray-900 dark:text-gray-100">Site Name: {siteData.site?.site_name || ''}</h1>
          </div>
          {/* Actions menu (right) */}
          <div className="flex-shrink-0">
            <ActionsDropdown
              onAddNote={() => setShowAddNoteModal(true)}
              onTestMeter={handleTestMeter}
              onChangeSim={() => setShowChangeSim(true)}
              onChangeMeter={() => setShowChangeMeter(true)}
              onCompareReadings={() => setShowCompareReadings(true)}
              onAddAlert={() => setShowAddAlert(true)}
              onManageAlerts={() => setShowManageAlerts(true)}
              onMeterHistory={() => setShowMeterHistory(true)}
              onTextMessage={() => setShowTextMessageModal(true)}
              onSiteReadingReport={() => setShowSiteReadingReportModal(true)}
              onAdvancedMonitoring={() => setShowAdvancedMonitoringModal(true)}
            />
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
                  />
                  <div className={`mt-4 flex items-center gap-2 text-lg font-semibold ${isSuccess ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}
                  >
                    {isSuccess ? <CheckCircleIcon color="success" /> : <ErrorIcon color="error" />}
                    {isSuccess
                      ? `Meter test successful! Reading: ${value.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })} kWh`
                      : 'Meter test failed: No valid reading found.'}
                  </div>
                  {isSuccess && (
                    <button
                      className="mt-2 flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      onClick={handleShowDetails}
                    >
                      {showDetails ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                      {showDetails ? 'Hide Details' : 'Show Details'}
                    </button>
                  )}
                  {isSuccess && showDetails && (
                    <button
                      className="absolute top-0 right-0 text-gray-400 hover:text-black dark:hover:text-white"
                      onClick={handleCloseResultBar}
                      title="Close"
                    >
                      <CloseIcon />
                    </button>
                  )}
                  {isSuccess && showDetails && (
                    <div className="mt-2 w-full bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded p-4 text-xs text-left overflow-x-auto max-h-96">
                      {Object.entries(obis).map(([code, data]) => (
                        <div key={code} className="mb-2">
                          <div className="font-semibold text-gray-800 dark:text-gray-100">{OBIS_MAP[code] || code}</div>
                          <div className="ml-2 text-gray-700 dark:text-gray-200">
                            {typeof data === 'object' && data !== null ? (
                              Object.entries(data).map(([k, v]) => (
                                <div key={k}><span className="font-mono text-gray-500 dark:text-gray-400">{k}:</span> {String(v)}</div>
                              ))
                            ) : (
                              <span>{String(data)}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
            {meterTestError && (
              <Alert severity="error" className="mt-2 w-64 dark:bg-gray-800 dark:text-red-400">
                {meterTestError}
              </Alert>
            )}
          </div>
        )}
        <div className="flex flex-col lg:flex-row gap-6 px-8 py-6">
          {/* Left Card: Site + Landlord Details */}
          <div className="w-full lg:w-1/3">
            <SiteLandlordCard site={{...siteData.site, last_reading: lastReading, last_reading_date: lastReadingDate}} customer={siteData.customer} />
          </div>
          {/* Main Content: Tabs */}
          <div className="w-full lg:w-2/3 flex flex-col gap-6">
            <div className="border-b border-gray-200 dark:border-gray-700 flex mb-0">
              {[
                { key: 'readings', label: 'Readings' },
                { key: 'meter-info', label: 'Meter Info' },
                { key: 'visualisations', label: 'Visualisations' },
                { key: 'jobs', label: 'Jobs' },
                { key: 'calls', label: 'Calls' },
              ].map(tab => (
                <button
                  key={tab.key}
                  className={`px-6 py-3 -mb-px font-medium border-b-2 transition-colors duration-150 focus:outline-none ${
                    activeTab === tab.key
                      ? 'border-green-600 dark:border-green-400 text-green-700 dark:text-green-300 bg-white dark:bg-gray-900'
                      : 'border-transparent text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:text-green-700 dark:hover:text-green-300'
                  }`}
                  onClick={() => setActiveTab(tab.key)}
                  style={{ borderTopLeftRadius: '0.5rem', borderTopRightRadius: '0.5rem' }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-b shadow p-6">
              {activeTab === 'readings' && <ReadingsTab readings={siteData.readings ?? []} meterTests={siteData.meter_tests ?? []} />}
              {activeTab === 'meter-info' && <MeterInfoTab meter={siteData.active_meter} sim={siteData.sim} />}
              {activeTab === 'visualisations' && (<div className="text-gray-400 dark:text-gray-500">Coming soon...</div>)}
              {activeTab === 'jobs' && <JobsTab siteId={Number(siteId)} />}
              {activeTab === 'calls' && <CallsTab calls={siteData.calls ?? []} />}
            </div>
          </div>
        </div>
        {/* System Notes Table */}
        <div className="px-8 pb-8">
          <SystemNotesTable
            key={notesTableKey}
            notes={Array.isArray(siteData.notes) ? (siteData.notes as ApiNote[]).map(mapApiNoteToUiNote) : []}
            onAddNote={() => setShowAddNoteModal(true)}
          />
        </div>
        {/* Add Note Modal Placeholder */}
        {showAddNoteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-900 rounded shadow-lg p-8 w-full max-w-lg relative">
              <button className="absolute top-4 right-4 text-gray-400 hover:text-black text-2xl" onClick={() => setShowAddNoteModal(false)}>&times;</button>
              <h2 className="text-2xl font-bold mb-1">Add New Note</h2>
              <div className="text-gray-500 dark:text-gray-300 mb-6">Create a new note for this site. Tag it with a department for easier filtering.</div>
              <div className="mb-4">
                <label className="block font-semibold mb-1">Department Tag</label>
                <select
                  className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
                  value={selectedDepartment ?? ''}
                  onChange={e => setSelectedDepartment(Number(e.target.value) || null)}
                >
                  <option value="">Select department</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block font-semibold mb-1">Note Content</label>
                <textarea
                  className="w-full border rounded px-3 py-2 min-h-[100px] bg-white dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
                  placeholder="Enter your note here..."
                  value={noteContent}
                  onChange={e => setNoteContent(e.target.value)}
                />
              </div>
              <div className="mb-6">
                <label className="block font-semibold mb-1">Attachments</label>
                <div className="flex items-center gap-4">
                  <label className="w-16 h-16 border-2 border-dashed rounded flex items-center justify-center cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => setNoteImage(e.target.files?.[0] || null)}
                    />
                    <span className="text-2xl text-gray-400">&#128247;+</span>
                  </label>
                  {noteImage && <span className="text-xs">{noteImage.name}</span>}
                </div>
              </div>
              {noteError && <div className="text-red-500 mb-2">{noteError}</div>}
              <div className="flex justify-end gap-2">
                <button className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 dark:text-gray-100" onClick={() => setShowAddNoteModal(false)} disabled={noteLoading}>Cancel</button>
                <button className="px-4 py-2 rounded bg-black text-white dark:bg-blue-700 dark:hover:bg-blue-800" onClick={handleSaveNote} disabled={noteLoading}>{noteLoading ? 'Saving...' : 'Save Note'}</button>
              </div>
            </div>
          </div>
        )}
        {showChangeSim && (
          <ChangeSimModal
            isOpen={showChangeSim}
            onClose={() => setShowChangeSim(false)}
            siteId={siteId || ''}
            currentSimNum={siteData.sim?.sim_num ? String(siteData.sim.sim_num) : ''}
            onSuccess={() => {/* Optionally refresh site data */}}
          />
        )}
        {showChangeMeter && (
          <ChangeMeterModal
            isOpen={showChangeMeter}
            onClose={() => setShowChangeMeter(false)}
            siteId={siteId || ''}
            currentMeterSerial={siteData.active_meter?.meter_serial ? String(siteData.active_meter.meter_serial) : ''}
            onSuccess={() => {/* Optionally refresh site data */}}
          />
        )}
        {showCompareReadings && (
          <CompareReadingsModal
            isOpen={showCompareReadings}
            onClose={() => setShowCompareReadings(false)}
            siteId={siteId || ''}
          />
        )}
        {showAddAlert && (
          <AddAlertModal
            isOpen={showAddAlert}
            onClose={() => setShowAddAlert(false)}
            siteId={siteId || ''}
            onSuccess={() => {/* Optionally refresh alerts */}}
          />
        )}
        {showEditAlert && alertToEdit && (
          <EditAlertModal
            isOpen={showEditAlert}
            onClose={() => setShowEditAlert(false)}
            alert={alertToEdit}
            onSuccess={() => {/* Optionally refresh alerts */}}
          />
        )}
        {showMeterHistory && (
          <MeterHistoryModal
            isOpen={showMeterHistory}
            onClose={() => setShowMeterHistory(false)}
            siteId={siteId || ''}
            siteName={siteData.site?.site_name ? String(siteData.site.site_name) : ''}
            siteReference={typeof siteData.site?.site_reference === 'string' ? siteData.site.site_reference : ''}
            availableMeters={Array.isArray(siteData.meters) ? (siteData.meters as Meter[]) : []}
          />
        )}
        {showManageAlerts && (
          <ManageAlertsModal
            isOpen={showManageAlerts}
            onClose={() => setShowManageAlerts(false)}
            siteId={siteId || ''}
            onEdit={(alert) => { setAlertToEdit(alert); setShowEditAlert(true); }}
            onSuccess={() => {/* Optionally refresh alerts */}}
          />
        )}
        {showTextMessageModal && (
          <TextMessageModal
            isOpen={showTextMessageModal}
            onClose={() => setShowTextMessageModal(false)}
            siteId={siteId || ''}
            customer={siteData.customer}
            sim={siteData.sim}
            site={siteData.site}
          />
        )}
        {showSiteReadingReportModal && (
          <SiteReadingReportModal
            isOpen={showSiteReadingReportModal}
            onClose={() => setShowSiteReadingReportModal(false)}
            siteId={siteId || ''}
            siteName={siteData.site?.site_name ? String(siteData.site.site_name) : ''}
            siteReference={typeof siteData.site?.site_reference === 'string' ? siteData.site.site_reference : ''}
            availableMeters={Array.isArray(siteData.meters) ? (siteData.meters as Meter[]) : []}
          />
        )}
        {showAdvancedMonitoringModal && (
          <AdvancedMonitoringModal
            open={showAdvancedMonitoringModal}
            onClose={() => setShowAdvancedMonitoringModal(false)}
            siteId={siteId || ''}
          />
        )}
      </div>
    </>
  );
};

export default StaffSiteDetailPage; 