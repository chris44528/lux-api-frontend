import React, { useState, useEffect } from 'react';
import { format, parseISO, subDays, addDays } from 'date-fns';
import { getMeterReadingSessions, MeterReadingSession, DailySummary } from '../../services/api';
import { DashboardHeader } from '../JobManagement/dashboard-header';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell
} from 'recharts';

type Period = 'day' | 'week' | 'month';

const ReadingReport = () => {
    const [period, setPeriod] = useState<Period>('week');
    const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [dailySessions, setDailySessions] = useState<MeterReadingSession[]>([]);
    const [summary, setSummary] = useState<DailySummary[]>([]);
    const [overallStats, setOverallStats] = useState<any>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getMeterReadingSessions(period, date);
            setDailySessions(data.daily_sessions);
            setSummary(data.summary);
            setOverallStats(data.overall_stats);
        } catch (err) {
            setError('Failed to fetch meter reading data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [period, date]);

    const handlePeriodChange = (newPeriod: Period) => {
        setPeriod(newPeriod);
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDate(e.target.value);
    };

    const handlePrevious = () => {
        const currentDate = parseISO(date);
        let newDate;
        
        if (period === 'day') {
            newDate = subDays(currentDate, 1);
        } else if (period === 'week') {
            newDate = subDays(currentDate, 7);
        } else {
            // For month, go back to the first day of the previous month
            const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
            newDate = prevMonth;
        }
        
        setDate(format(newDate, 'yyyy-MM-dd'));
    };

    const handleNext = () => {
        const currentDate = parseISO(date);
        let newDate;
        
        if (period === 'day') {
            newDate = addDays(currentDate, 1);
        } else if (period === 'week') {
            newDate = addDays(currentDate, 7);
        } else {
            // For month, go to the first day of the next month
            const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
            newDate = nextMonth;
        }
        
        // Don't allow future dates
        if (newDate <= new Date()) {
            setDate(format(newDate, 'yyyy-MM-dd'));
        }
    };

    const formatTime = (dateTimeStr: string) => {
        return format(parseISO(dateTimeStr), 'HH:mm:ss');
    };

    const formatDate = (dateStr: string) => {
        if (typeof dateStr === 'string') {
            return format(parseISO(dateStr), 'EEE, MMM d');
        }
        return dateStr;
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

    // Prepare data for the daily sessions chart
    const sessionChartData = dailySessions.map(session => ({
        ...session,
        time: formatTime(session.start_time),
        date: format(parseISO(session.start_time), 'yyyy-MM-dd'),
    }));

    // Prepare data for the summary chart
    const summaryChartData = summary.map(day => ({
        ...day,
        date: typeof day.date === 'string' ? formatDate(day.date) : day.date,
    }));

    // Prepare data for the success rate pie chart
    const successRateData = [
        { name: 'Successful', value: overallStats?.total_successful_reads || 0 },
        { name: 'Failed', value: overallStats?.total_failed_reads || 0 }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <DashboardHeader />
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <h1 className="text-2xl font-semibold text-gray-900">Meter Reading Report</h1>
                    
                    {/* Controls */}
                    <div className="mt-4 flex flex-wrap items-center gap-4">
                        <div className="flex space-x-2">
                            <button
                                onClick={() => handlePeriodChange('day')}
                                className={`px-3 py-2 rounded-md ${period === 'day' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}
                            >
                                Day
                            </button>
                            <button
                                onClick={() => handlePeriodChange('week')}
                                className={`px-3 py-2 rounded-md ${period === 'week' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}
                            >
                                Week
                            </button>
                            <button
                                onClick={() => handlePeriodChange('month')}
                                className={`px-3 py-2 rounded-md ${period === 'month' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}
                            >
                                Month
                            </button>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={handlePrevious}
                                className="p-2 rounded-md bg-white border text-gray-700"
                            >
                                &larr;
                            </button>
                            <input
                                type="date"
                                value={date}
                                onChange={handleDateChange}
                                className="p-2 rounded-md border"
                            />
                            <button
                                onClick={handleNext}
                                className="p-2 rounded-md bg-white border text-gray-700"
                                disabled={format(new Date(), 'yyyy-MM-dd') === date}
                            >
                                &rarr;
                            </button>
                        </div>
                        
                        <button
                            onClick={fetchData}
                            className="px-3 py-2 rounded-md bg-green-600 text-white"
                        >
                            Refresh
                        </button>
                    </div>
                    
                    {loading ? (
                        <div className="mt-8 flex justify-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    ) : error ? (
                        <div className="mt-8 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                            {error}
                        </div>
                    ) : (
                        <>
                            {/* Overall Stats */}
                            <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="bg-white p-4 rounded-lg shadow">
                                    <h3 className="text-lg font-medium text-gray-900">Total Sessions</h3>
                                    <p className="mt-2 text-3xl font-bold text-blue-600">{overallStats?.total_sessions || 0}</p>
                                </div>
                                <div className="bg-white p-4 rounded-lg shadow">
                                    <h3 className="text-lg font-medium text-gray-900">Total Meters</h3>
                                    <p className="mt-2 text-3xl font-bold text-blue-600">{overallStats?.total_meters || 0}</p>
                                </div>
                                <div className="bg-white p-4 rounded-lg shadow">
                                    <h3 className="text-lg font-medium text-gray-900">Successful Reads</h3>
                                    <p className="mt-2 text-3xl font-bold text-green-600">{overallStats?.total_successful_reads || 0}</p>
                                </div>
                                <div className="bg-white p-4 rounded-lg shadow">
                                    <h3 className="text-lg font-medium text-gray-900">Success Rate</h3>
                                    <p className="mt-2 text-3xl font-bold text-green-600">{overallStats?.average_success_rate || 0}%</p>
                                </div>
                            </div>
                            
                            {/* Charts */}
                            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Daily Summary Chart */}
                                <div className="bg-white p-4 rounded-lg shadow">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Summary</h3>
                                    <div className="h-80">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={summaryChartData}
                                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="date" />
                                                <YAxis />
                                                <Tooltip />
                                                <Legend />
                                                <Bar dataKey="successful_reads" name="Successful Reads" fill="#4ade80" />
                                                <Bar dataKey="failed_reads" name="Failed Reads" fill="#f87171" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                
                                {/* Success Rate Chart */}
                                <div className="bg-white p-4 rounded-lg shadow">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Success Rate by Day</h3>
                                    <div className="h-80">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart
                                                data={summaryChartData}
                                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="date" />
                                                <YAxis domain={[0, 100]} />
                                                <Tooltip />
                                                <Legend />
                                                <Line 
                                                    type="monotone" 
                                                    dataKey="success_rate" 
                                                    name="Success Rate (%)" 
                                                    stroke="#8884d8" 
                                                    activeDot={{ r: 8 }} 
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                
                                {/* Session Distribution Chart */}
                                <div className="bg-white p-4 rounded-lg shadow">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Session Distribution</h3>
                                    <div className="h-80">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={sessionChartData}
                                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="time" />
                                                <YAxis />
                                                <Tooltip />
                                                <Legend />
                                                <Bar dataKey="total_meters" name="Total Meters" fill="#60a5fa" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                
                                {/* Success vs Failure Pie Chart */}
                                <div className="bg-white p-4 rounded-lg shadow">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Success vs Failure</h3>
                                    <div className="h-80 flex justify-center items-center">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={successRateData}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                >
                                                    {successRateData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#4ade80' : '#f87171'} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Sessions Table */}
                            <div className="mt-8 bg-white p-4 rounded-lg shadow overflow-x-auto">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Reading Sessions</h3>
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Time</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Time</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Meters</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Successful</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Failed</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Success Rate</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration (min)</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meter Band</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {dailySessions.map((session) => (
                                            <tr key={session.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {format(parseISO(session.start_time), 'yyyy-MM-dd')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatTime(session.start_time)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatTime(session.end_time)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {session.total_meters}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                                                    {session.successful_reads}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                                                    {session.failed_reads}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                        session.success_rate >= 90 ? 'bg-green-100 text-green-800' :
                                                        session.success_rate >= 70 ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                        {session.success_rate}%
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {session.execution_time_minutes.toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {session.meter_band}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                
                                {dailySessions.length === 0 && (
                                    <div className="py-4 text-center text-gray-500">
                                        No sessions found for this period.
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReadingReport; 