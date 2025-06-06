import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { getSiteReadings } from '../services/api';

// Utility function for formatting meter readings
const formatMeterReading = (value: number | string): string => {
  if (!value || value === '-') return '-';
  
  // Convert string to number if needed
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Check if it's a valid number
  if (isNaN(numValue)) return 'N/A';
  
  // Format with thousand separator and 4 decimal places
  return `${numValue.toLocaleString(undefined, {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4
  })} kWh`;
};

// Define a proper interface for readings
interface Reading {
    date: string;
    meter_reading: string;
    meter_serial: string;
    generation_increase: string | null;
}

interface DateRange {
    id: string;
    startDate: string;
    endDate: string;
    readings: Reading[];
    isLoading: boolean;
    error?: string;
}

interface CompareReadingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    siteId: string;
}

const CompareReadingsModal: React.FC<CompareReadingsModalProps> = ({ isOpen, onClose, siteId }) => {
    const [dateRanges, setDateRanges] = useState<DateRange[]>([
        { id: '1', startDate: '', endDate: '', readings: [], isLoading: false },
        { id: '2', startDate: '', endDate: '', readings: [], isLoading: false }
    ]);

    if (!isOpen) return null;

    const handleAddRange = () => {
        if (dateRanges.length >= 3) return;
        const newId = Date.now().toString(); // Use timestamp for unique ID
        setDateRanges([...dateRanges, { id: newId, startDate: '', endDate: '', readings: [], isLoading: false }]);
    };

    const handleRemoveRange = (id: string) => {
        // Always keep at least 2 date ranges
        if (dateRanges.length <= 2) return;
        setDateRanges(dateRanges.filter(range => range.id !== id));
    };

    const handleDateChange = async (id: string, field: 'startDate' | 'endDate', value: string) => {
        const updatedRanges = dateRanges.map(range => {
            if (range.id === id) {
                return { ...range, [field]: value };
            }
            return range;
        });
        setDateRanges(updatedRanges);

        // If both dates are set for this range, fetch readings
        const currentRange = updatedRanges.find(r => r.id === id);
        if (currentRange?.startDate && currentRange?.endDate) {
            // Validate dates
            const start = new Date(currentRange.startDate);
            const end = new Date(currentRange.endDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison
            
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                setDateRanges(ranges => ranges.map(range => 
                    range.id === id 
                        ? { ...range, error: 'Invalid date format' }
                        : range
                ));
                return;
            }
            
            if (start > end) {
                setDateRanges(ranges => ranges.map(range => 
                    range.id === id 
                        ? { ...range, error: 'Start date must be before end date' }
                        : range
                ));
                return;
            }
            
            // Check for future dates
            if (start > today || end > today) {
                setDateRanges(ranges => ranges.map(range => 
                    range.id === id 
                        ? { ...range, error: 'Warning: Selected date range includes future dates. No readings will be available for future dates.' }
                        : range
                ));
                // Still proceed with the fetch, but with the warning
            }
            
            await fetchReadings(id, currentRange.startDate, currentRange.endDate);
        }
    };

    const fetchReadings = async (id: string, startDate: string, endDate: string) => {
        // Set loading state
        setDateRanges(ranges => ranges.map(range => 
            range.id === id ? { ...range, isLoading: true, error: undefined } : range
        ));

        try {
            const response = await getSiteReadings(siteId, {
                startDate,
                endDate,
                pageSize: 1000
            });

            if (response?.readings) {
                setDateRanges(ranges => ranges.map(range => 
                    range.id === id 
                        ? { ...range, readings: response.readings || [], isLoading: false }
                        : range
                ));
            } else {
                throw new Error('No readings returned from API');
            }
        } catch (error) {
            const errorMessage = error instanceof Error 
                ? error.message 
                : 'Failed to fetch readings. Please check the date format and try again.';
            setDateRanges(ranges => ranges.map(range => 
                range.id === id 
                    ? { ...range, isLoading: false, error: errorMessage }
                    : range
            ));
        }
    };

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-7xl h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold dark:text-white">Compare Readings</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="flex gap-4 mb-6">
                    {dateRanges.map((range) => (
                        <div key={range.id} className="flex-1 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium dark:text-white">Date Range {range.id}</h3>
                                {dateRanges.length > 2 && (
                                    <button
                                        onClick={() => handleRemoveRange(range.id)}
                                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Start Date
                                    </label>
                                    <input
                                        type="date"
                                        value={range.startDate}
                                        max={range.endDate || undefined}
                                        onChange={(e) => handleDateChange(range.id, 'startDate', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        End Date
                                    </label>
                                    <input
                                        type="date"
                                        value={range.endDate}
                                        min={range.startDate || undefined}
                                        onChange={(e) => handleDateChange(range.id, 'endDate', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
                                    />
                                </div>
                            </div>
                            {range.error && (
                                <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                                    {range.error}
                                </div>
                            )}
                        </div>
                    ))}
                    {dateRanges.length < 3 && (
                        <button
                            onClick={handleAddRange}
                            className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 self-center"
                        >
                            <Plus size={24} />
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-auto">
                    <div className={`grid gap-4 h-full ${dateRanges.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                        {dateRanges.map((range) => (
                            <div key={range.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                                    <h3 className="font-medium dark:text-white">
                                        Readings for {range.startDate} to {range.endDate}
                                    </h3>
                                </div>
                                <div className="overflow-auto h-[calc(100%-3rem)]">
                                    {range.isLoading ? (
                                        <div className="flex items-center justify-center h-full">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
                                        </div>
                                    ) : range.error ? (
                                        <div className="flex items-center justify-center h-full text-red-600 dark:text-red-400">
                                            {range.error}
                                        </div>
                                    ) : range.readings.length > 0 ? (
                                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                            <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                        Date
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                        Reading
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                        Generation
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                                {range.readings.map((reading, idx) => (
                                                    <tr key={idx}>
                                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                            {reading.date}
                                                        </td>
                                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                            {reading.meter_reading ? formatMeterReading(reading.meter_reading) : '-'}
                                                        </td>
                                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                            {reading.generation_increase ? formatMeterReading(reading.generation_increase) : '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                                            No readings available
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompareReadingsModal;
