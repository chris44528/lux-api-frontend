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
            className="border rounded px-3 py-2 text-sm w-48"
          />
          <button className="px-3 py-2 bg-gray-200 rounded text-sm">Sort</button>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-2 bg-black text-white rounded text-sm flex items-center gap-1">
            <span role="img" aria-label="call">📞</span> New Call
          </button>
          <button className="px-3 py-2 bg-gray-200 rounded text-sm flex items-center gap-1">
            <span role="img" aria-label="import">⬆️</span> Import Calls
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border rounded">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="py-2 px-2 text-left">Call ID</th>
              <th className="py-2 px-2 text-left">Caller</th>
              <th className="py-2 px-2 text-left">Phone Number</th>
              <th className="py-2 px-2 text-left">Date & Time</th>
              <th className="py-2 px-2 text-left">Duration</th>
              <th className="py-2 px-2 text-left">Type</th>
              <th className="py-2 px-2 text-left">Status</th>
              <th className="py-2 px-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCalls.length > 0 ? filteredCalls.map((call) => (
              <tr key={call.id} className="border-b last:border-0">
                <td className="py-2 px-2 font-mono font-semibold">{call.id}</td>
                <td className="py-2 px-2">{call.caller}</td>
                <td className="py-2 px-2">{call.phone}</td>
                <td className="py-2 px-2">{call.date} {call.time}</td>
                <td className="py-2 px-2">{call.duration}</td>
                <td className="py-2 px-2">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${call.type === 'Inbound' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>{call.type}</span>
                </td>
                <td className="py-2 px-2">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${call.status === 'Completed' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{call.status}</span>
                </td>
                <td className="py-2 px-2">
                  <button className="text-blue-600 underline text-xs mr-2">View</button>
                  <button className="text-gray-600 underline text-xs">Edit</button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={8} className="text-center py-4 text-gray-400">No calls found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CallsTab; 