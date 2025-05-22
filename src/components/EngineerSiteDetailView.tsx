import React, { useState } from 'react';
import { SiteDetailResponse } from '../types/api';
// Import UI components (Tabs, Button, etc.) - likely from Shadcn/ui or similar

interface EngineerSiteDetailViewProps {
  site: SiteDetailResponse;
  includeHeader?: boolean; // Optional prop to determine if header should be included
}

function EngineerSiteDetailView({ site, includeHeader = false }: EngineerSiteDetailViewProps) {
  const [activeTab, setActiveTab] = useState('site');
  
  return (
    <div className="bg-white rounded shadow overflow-hidden">
      <div className="bg-gray-50 p-4">
        <h1 className="text-xl font-bold text-center">{site?.site?.site_name || 'Site Detail'}</h1>
      </div>
      
      {/* Tab navigation */}
      <div className="flex border-b">
        <button
          className={`flex-1 py-2 px-4 text-center ${activeTab === 'site' 
            ? 'border-b-2 border-green-600 text-green-600 font-medium' 
            : 'text-gray-500'}`}
          onClick={() => setActiveTab('site')}
        >
          Site
        </button>
        <button
          className={`flex-1 py-2 px-4 text-center ${activeTab === 'customer' 
            ? 'border-b-2 border-green-600 text-green-600 font-medium' 
            : 'text-gray-500'}`}
          onClick={() => setActiveTab('customer')}
        >
          Customer
        </button>
        <button
          className={`flex-1 py-2 px-4 text-center ${activeTab === 'meter' 
            ? 'border-b-2 border-green-600 text-green-600 font-medium' 
            : 'text-gray-500'}`}
          onClick={() => setActiveTab('meter')}
        >
          Meter
        </button>
        <button
          className={`flex-1 py-2 px-4 text-center ${activeTab === 'readings' 
            ? 'border-b-2 border-green-600 text-green-600 font-medium' 
            : 'text-gray-500'}`}
          onClick={() => setActiveTab('readings')}
        >
          Readings
        </button>
        <button
          className={`flex-1 py-2 px-4 text-center ${activeTab === 'jobs' 
            ? 'border-b-2 border-green-600 text-green-600 font-medium' 
            : 'text-gray-500'}`}
          onClick={() => setActiveTab('jobs')}
        >
          Jobs
        </button>
      </div>
      
      {/* Tab content */}
      <div className="p-4">
        {activeTab === 'site' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="grid grid-cols-2 border-b pb-2">
                <span className="font-medium">Address:</span>
                <span>{site?.site?.address || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-2 border-b pb-2">
                <span className="font-medium">Postcode:</span>
                <span>{site?.site?.postcode || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-2 border-b pb-2">
                <span className="font-medium">Region:</span>
                <span>{site?.site?.region || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-2 border-b pb-2">
                <span className="font-medium">Install Date:</span>
                <span>{site?.site?.install_date || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-2 border-b pb-2">
                <span className="font-medium">FIT ID:</span>
                <span>{site?.site?.fit_id || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-2 border-b pb-2">
                <span className="font-medium">FCO:</span>
                <span>{site?.site?.fco || 'N/A'}</span>
              </div>
            </div>
            
            {/* Special flags */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className={`p-2 text-center text-sm rounded ${site?.site?.low_riso ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-500'}`}>
                Low RISO
              </div>
              <div className={`p-2 text-center text-sm rounded ${site?.site?.shading ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-500'}`}>
                Shading
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'customer' && (
          <div className="space-y-4">
            <div className="p-4 rounded bg-gray-50 text-center">
              <div className="font-bold text-lg mb-2">{site?.customer?.owner || 'N/A'}</div>
              <div className="mb-1">{site?.customer?.phone || 'N/A'}</div>
              <div className="mb-1">{site?.customer?.email || 'N/A'}</div>
              <div>{site?.customer?.owner_address || 'N/A'}</div>
            </div>
          </div>
        )}
        
        {activeTab === 'meter' && (
          <div className="space-y-4">
            <div className="p-4 rounded bg-gray-50">
              <h3 className="font-medium mb-3">Meter Details</h3>
              <div className="space-y-2">
                <div className="grid grid-cols-2 border-b pb-2">
                  <span className="font-medium">Model:</span>
                  <span>{site?.meters?.[0]?.meter_model || 'N/A'}</span>
                </div>
                <div className="grid grid-cols-2 border-b pb-2">
                  <span className="font-medium">Serial:</span>
                  <span>{site?.meters?.[0]?.meter_serial || 'N/A'}</span>
                </div>
                <div className="grid grid-cols-2 border-b pb-2">
                  <span className="font-medium">Install Date:</span>
                  <span>{site?.meters?.[0]?.install_date || 'N/A'}</span>
                </div>
                <div className="grid grid-cols-2 border-b pb-2">
                  <span className="font-medium">Last Reading:</span>
                  <span>{site?.meters?.[0]?.last_reading || 'N/A'}</span>
                </div>
              </div>
            </div>
            
            <div className="p-4 rounded bg-gray-50">
              <h3 className="font-medium mb-3">SIM Details</h3>
              <div className="space-y-2">
                <div className="grid grid-cols-2 border-b pb-2">
                  <span className="font-medium">Number:</span>
                  <span>{site?.sim?.sim_num || 'N/A'}</span>
                </div>
                <div className="grid grid-cols-2 border-b pb-2">
                  <span className="font-medium">CTN:</span>
                  <span>{site?.sim?.ctn || 'N/A'}</span>
                </div>
                <div className="grid grid-cols-2 border-b pb-2">
                  <span className="font-medium">IP:</span>
                  <span>{site?.sim?.sim_ip || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'readings' && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-2 py-1 text-left text-xs">Date</th>
                    <th className="border px-2 py-1 text-left text-xs">Reading</th>
                    <th className="border px-2 py-1 text-left text-xs">Gen</th>
                  </tr>
                </thead>
                <tbody>
                  {site?.readings?.slice(0, 10).map((reading, index) => (
                    <tr key={index} className="border-b">
                      <td className="border px-2 py-1 text-xs">{reading.date}</td>
                      <td className="border px-2 py-1 text-xs">{reading.meter_reading}</td>
                      <td className="border px-2 py-1 text-xs">{reading.generation_increase || '-'}</td>
                    </tr>
                  ))}
                  {(!site?.readings || site.readings.length === 0) && (
                    <tr>
                      <td colSpan={3} className="border px-2 py-4 text-center text-sm text-gray-500">
                        No readings available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {activeTab === 'jobs' && (
          <div className="space-y-4">
            <div className="p-4 rounded bg-gray-50 text-center">
              <p className="text-gray-500">No jobs currently assigned to this site</p>
            </div>
            <button className="w-full py-2 bg-green-600 text-white rounded font-medium">
              Request Job
            </button>
          </div>
        )}
      </div>
      
      {/* Action buttons */}
      <div className="p-4 border-t bg-gray-50">
        <div className="grid grid-cols-2 gap-2">
          <button className="py-2 bg-green-600 text-white rounded font-medium">
            Test Meter
          </button>
          <button className="py-2 bg-gray-200 text-gray-800 rounded font-medium">
            Add Reading
          </button>
        </div>
      </div>
    </div>
  );
}

export default EngineerSiteDetailView; 