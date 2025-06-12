import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getSiteReadings } from '../../services/api';

interface MeterTest {
  id?: number;
  test_reading?: string;
  test_date?: string;
  signal_level?: string;
}

interface Reading {
  date: string;
  meter_reading?: string;
  value?: string;
  generation?: string;
  generation_increase?: string;
  daily_gen?: string;
  daily_gen_status?: string;
}

interface ReadingsTabProps {
  readings: Reading[];
  meterTests?: MeterTest[];
}

const ReadingsTab: React.FC<ReadingsTabProps> = ({ readings = [], meterTests = [] }) => {
  const { siteId } = useParams<{ siteId: string }>();
  const [expanded, setExpanded] = useState(false);
  const [displayedReadings, setDisplayedReadings] = useState<Reading[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [endOfDay, setEndOfDay] = useState(true);
  const readingsContainerRef = useRef<HTMLDivElement>(null);

  // On mount, use initial readings from props
  useEffect(() => {
    // Sort readings newest to oldest
    const sorted = [...readings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setDisplayedReadings(sorted);
    setHasMore(true);
  }, [readings]);

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = async () => {
      if (!readingsContainerRef.current || loadingMore || !hasMore) return;
      const { scrollTop, scrollHeight, clientHeight } = readingsContainerRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        setLoadingMore(true);
        // Find the earliest date loaded
        const earliest = displayedReadings[displayedReadings.length - 1]?.date;
        if (siteId && earliest) {
          try {
            const resp = await getSiteReadings(siteId, { endDate: earliest });
            let newReadings = resp.readings || [];
            // Skip the first reading if it matches the last date (overlap for correct daily_gen)
            if (newReadings.length && displayedReadings.length && newReadings[0].date === displayedReadings[displayedReadings.length - 1].date) {
              newReadings = newReadings.slice(1);
            }
            // Prevent duplicates
            const unique = newReadings.filter(r => !displayedReadings.some(d => d.date === r.date));
            setDisplayedReadings(prev => [...prev, ...unique]);
            setHasMore((resp.pagination && resp.pagination.has_more) ?? false);
          } catch (e) {
            setHasMore(false);
          }
        }
        setLoadingMore(false);
      }
    };
    const ref = readingsContainerRef.current;
    if (ref) ref.addEventListener('scroll', handleScroll);
    return () => { if (ref) ref.removeEventListener('scroll', handleScroll); };
  }, [loadingMore, displayedReadings, hasMore, siteId]);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Meter Test History */}
      <div className={`bg-white dark:bg-gray-800 rounded shadow dark:shadow-gray-700 p-4 w-full lg:w-1/2 ${expanded ? 'hidden lg:block' : ''}`}>
        <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Meter Test History</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b dark:border-gray-700">
              <th className="py-1 text-left text-gray-700 dark:text-gray-300">Meter Reading</th>
              <th className="py-1 text-left text-gray-700 dark:text-gray-300">Test Date</th>
              <th className="py-1 text-left text-gray-700 dark:text-gray-300">Signal Level</th>
            </tr>
          </thead>
          <tbody>
            {meterTests.length > 0 ? meterTests.map((test, idx) => (
              <tr key={test.id || idx} className="border-b dark:border-gray-700 last:border-0">
                <td className="py-1 text-gray-900 dark:text-gray-100">{
                  test.test_reading
                    ? `${(parseFloat(test.test_reading)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kWh`
                    : ''
                }</td>
                <td className="py-1 text-gray-900 dark:text-gray-100">{
                  test.test_date
                    ? (() => {
                        const d = new Date(test.test_date);
                        const dateStr = d.toLocaleDateString();
                        const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                        return <><div>{dateStr}</div><div>{timeStr}</div></>;
                      })()
                    : ''
                }</td>
                <td className="py-1 text-gray-900 dark:text-gray-100">{test.signal_level || ''}</td>
              </tr>
            )) : (
              <tr><td colSpan={3} className="text-center text-gray-400 dark:text-gray-500 py-2">No meter tests</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {/* All Readings */}
      <div
        className={`bg-white dark:bg-gray-800 rounded shadow dark:shadow-gray-700 p-4 w-full lg:w-1/2 transition-all ${expanded ? 'lg:w-full' : ''}`}
        style={expanded ? { height: '90vh', cursor: 'pointer' } : { height: 600, cursor: 'pointer' }}
        onClick={() => {
          // Only expand/collapse if not selecting text or clicking on an input
          if (window.getSelection()?.toString()) return;
          setExpanded(v => !v);
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">All Readings</h3>
        </div>
        <div
          className={`border dark:border-gray-700 rounded overflow-auto`}
          style={{ height: expanded ? 'calc(90vh - 60px)' : 500 }}
          ref={readingsContainerRef}
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="py-1 px-4 text-left text-gray-700 dark:text-gray-300">Date</th>
                <th className="py-1 text-left text-gray-700 dark:text-gray-300">Meter Reading</th>
                <th className="py-1 text-left text-gray-700 dark:text-gray-300">Daily Gen</th>
              </tr>
            </thead>
            <tbody>
              {displayedReadings.length > 0 ? displayedReadings.map((r: Reading, i) => (
                <tr key={r.date + i} className="border-b dark:border-gray-700 last:border-0">
                  <td className="py-1 px-4 text-gray-900 dark:text-gray-100">{r.date}</td>
                  <td className="py-1 text-gray-900 dark:text-gray-100">{r.meter_reading || ''}</td>
                  <td className={`py-1 ${
                    r.daily_gen_status === 'no_comms' || r.daily_gen_status === 'zero'
                      ? 'text-red-600 dark:text-red-400'
                      : r.daily_gen_status === 'amber'
                        ? 'text-amber-500 dark:text-amber-400'
                        : r.daily_gen_status === 'green'
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-900 dark:text-gray-100'
                  }`}>
                    {r.daily_gen || ''}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={3} className="text-center text-gray-400 dark:text-gray-500 py-2">No readings</td></tr>
              )}
            </tbody>
          </table>
          {loadingMore && <div className="text-center py-2 text-xs text-gray-400 dark:text-gray-500">Loading more...</div>}
        </div>
        <div className="flex justify-end mt-2">
          {/* Expand/Collapse button removed */}
        </div>
      </div>
    </div>
  );
};

export default ReadingsTab; 