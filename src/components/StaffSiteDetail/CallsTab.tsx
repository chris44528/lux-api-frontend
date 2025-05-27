import React, { useState } from 'react';

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

interface CallsTabProps {
  calls: CallRecord[];
}

const CallsTab: React.FC<CallsTabProps> = ({ calls }) => {
  const [search, setSearch] = useState('');
  const filteredCalls = calls.filter(
    (call) =>
      call.caller?.toLowerCase().includes(search.toLowerCase()) ||
      call.phone?.includes(search) ||
      call.id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
        <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Search calls..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border dark:border-gray-600 rounded px-3 py-2 text-sm w-48 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
          <button className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600">Sort</button>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-2 bg-black dark:bg-gray-700 text-white rounded text-sm flex items-center gap-1 hover:bg-gray-800 dark:hover:bg-gray-600">
            <span role="img" aria-label="call">📞</span> New Call
          </button>
          <button className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded text-sm flex items-center gap-1 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600">
            <span role="img" aria-label="import">⬆️</span> Import Calls
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border dark:border-gray-700 rounded">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
              <th className="py-2 px-2 text-left text-gray-700 dark:text-gray-300">Call ID</th>
              <th className="py-2 px-2 text-left text-gray-700 dark:text-gray-300">Caller</th>
              <th className="py-2 px-2 text-left text-gray-700 dark:text-gray-300">Phone Number</th>
              <th className="py-2 px-2 text-left text-gray-700 dark:text-gray-300">Date & Time</th>
              <th className="py-2 px-2 text-left text-gray-700 dark:text-gray-300">Duration</th>
              <th className="py-2 px-2 text-left text-gray-700 dark:text-gray-300">Type</th>
              <th className="py-2 px-2 text-left text-gray-700 dark:text-gray-300">Status</th>
              <th className="py-2 px-2 text-left text-gray-700 dark:text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCalls.length > 0 ? filteredCalls.map((call) => (
              <tr key={call.id} className="border-b dark:border-gray-700 last:border-0 bg-white dark:bg-gray-900">
                <td className="py-2 px-2 font-mono font-semibold text-gray-900 dark:text-gray-100">{call.id}</td>
                <td className="py-2 px-2 text-gray-900 dark:text-gray-100">{call.caller}</td>
                <td className="py-2 px-2 text-gray-900 dark:text-gray-100">{call.phone}</td>
                <td className="py-2 px-2 text-gray-900 dark:text-gray-100">{call.date} {call.time}</td>
                <td className="py-2 px-2 text-gray-900 dark:text-gray-100">{call.duration}</td>
                <td className="py-2 px-2">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${call.type === 'Inbound' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'}`}>{call.type}</span>
                </td>
                <td className="py-2 px-2">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${call.status === 'Completed' ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>{call.status}</span>
                </td>
                <td className="py-2 px-2">
                  <button className="text-blue-600 dark:text-blue-400 underline text-xs mr-2 hover:text-blue-800 dark:hover:text-blue-300">View</button>
                  <button className="text-gray-600 dark:text-gray-400 underline text-xs hover:text-gray-800 dark:hover:text-gray-300">Edit</button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={8} className="text-center py-4 text-gray-400 dark:text-gray-500">No calls found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CallsTab; 