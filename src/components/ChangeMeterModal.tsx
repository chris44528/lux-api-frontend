import React, { useState, useEffect } from 'react';
import { 
  searchMeters, 
  getMeterDetails, 
  changeMeter
} from '../services/api';
import { Meter } from '../types/api';
import { X, Search, Save } from 'lucide-react';
import debounce from 'lodash/debounce';

interface ChangeMeterModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteId: string;
  currentMeterSerial: string;
  onSuccess: () => void;
}

interface MeterDetailsState {
  id: number | null;
  meterModel: string;
  meterSerial: string;
  installDate: string;
  openingRead: string;
  lastReading: string;
  lastReadingDate: string;
  closingReading: string;
}

const ChangeMeterModal: React.FC<ChangeMeterModalProps> = ({
  isOpen,
  onClose,
  siteId,
  currentMeterSerial,
  onSuccess
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Meter[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMeter, setSelectedMeter] = useState<MeterDetailsState>({
    id: null,
    meterModel: '',
    meterSerial: '',
    installDate: new Date().toISOString().split('T')[0],
    openingRead: '',
    lastReading: 'N/A',
    lastReadingDate: 'N/A',
    closingReading: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [changeSimAfterward, setChangeSimAfterward] = useState(false);
  const [noPreviousMeterWarning, setNoPreviousMeterWarning] = useState(false);
  const [allowNoOldMeter, setAllowNoOldMeter] = useState(false);

  // Debounced search function
  // @ts-expect-error - Ignoring type error with debounce
  const debouncedSearch = debounce((term: string) => {
    if (term.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    searchMeters(term)
      .then(results => {
        setSearchResults(results);
      })
      .catch(err => {
        console.error('Error searching meters:', err);
        setError('Failed to search meters. Please try again.');
      })
      .finally(() => {
        setIsSearching(false);
      });
  }, 300);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    debouncedSearch(term);
  };

  // Handle meter selection
  const handleSelectMeter = async (meter: Meter) => {
    if (!meter.id) return;
    
    try {
      setLoading(true);
      const meterDetails = await getMeterDetails(meter.id);
      
      setSelectedMeter({
        id: meter.id,
        meterModel: meterDetails.meter_model || '',
        meterSerial: meterDetails.meter_serial || '',
        installDate: new Date().toISOString().split('T')[0],
        openingRead: meterDetails.meter_opening_read || '',
        lastReading: meterDetails.lastReading || 'N/A',
        lastReadingDate: meterDetails.lastReadingDate || 'N/A',
        closingReading: meterDetails.closingMeterReading || ''
      });
      
      setSearchResults([]);
      setSearchTerm('');
    } catch (err) {
      console.error('Error getting meter details:', err);
      setError('Failed to get meter details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!selectedMeter.id) {
      setError('Please select a meter first');
      return;
    }
    if (!selectedMeter.openingRead) {
      setError('Opening reading is required');
      return;
    }
    if (!selectedMeter.closingReading) {
      setError('Closing reading is required');
      return;
    }
    if (!currentMeterSerial && !allowNoOldMeter) {
      setNoPreviousMeterWarning(true);
      return;
    }
    const isConfirmed = window.confirm(
      `This will remove the old meter ${currentMeterSerial} and replace it with ${selectedMeter.meterSerial}. Do you want to proceed?`
    );
    if (!isConfirmed) return;
    try {
      setLoading(true);
      await changeMeter(siteId, {
        meter_model: selectedMeter.meterModel,
        meter_serial: selectedMeter.meterSerial,
        meter_install_date: selectedMeter.installDate,
        meter_opening_read: selectedMeter.openingRead,
        old_meter_serial: currentMeterSerial,
        closing_meter_reading: selectedMeter.closingReading
      });
      alert('Meter changed successfully');
      onSuccess();
      onClose();
      setAllowNoOldMeter(false);
      if (!changeSimAfterward) {
        window.location.reload();
      }
    } catch (err) {
      console.error('Error changing meter:', err);
      setError('Failed to change meter. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Reset state when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setSearchResults([]);
      setSelectedMeter({
        id: null,
        meterModel: '',
        meterSerial: '',
        installDate: new Date().toISOString().split('T')[0],
        openingRead: '',
        lastReading: 'N/A',
        lastReadingDate: 'N/A',
        closingReading: ''
      });
      setError(null);
      setChangeSimAfterward(false);
      setAllowNoOldMeter(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">Change Meter</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Search <strong>New</strong> Meter by Serial
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Enter New Meter serial"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  disabled={!!selectedMeter.id}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <Search size={16} className="text-gray-400" />
                </div>
              </div>
              
              {isSearching && (
                <div className="mt-2 p-2 text-center">
                  <div className="animate-spin inline-block w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
                </div>
              )}
              
              {searchResults.length > 0 && (
                <div className="mt-2 max-h-40 overflow-y-auto border rounded shadow-sm">
                  {searchResults.map((meter) => (
                    <div
                      key={meter.id}
                      onClick={() => handleSelectMeter(meter)}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                    >
                      <p><strong>{meter.meter_serial}</strong> - {meter.meter_model}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <input type="hidden" value={currentMeterSerial} />

            {selectedMeter.id && (
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    New Meter Model
                  </label>
                  <input
                    type="text"
                    value={selectedMeter.meterModel}
                    readOnly
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 bg-gray-100 leading-tight"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    New Meter Serial
                  </label>
                  <input
                    type="text"
                    value={selectedMeter.meterSerial}
                    readOnly
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 bg-gray-100 leading-tight"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    New Meter Install Date
                  </label>
                  <input
                    type="date"
                    value={selectedMeter.installDate}
                    onChange={(e) => setSelectedMeter({...selectedMeter, installDate: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    New Meter Opening Read
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={selectedMeter.openingRead}
                    onChange={(e) => setSelectedMeter({...selectedMeter, openingRead: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    New Meter Last Reading
                  </label>
                  <input
                    type="text"
                    value={selectedMeter.lastReading}
                    readOnly
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 bg-gray-100 leading-tight"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    New Meters Last Reading Date
                  </label>
                  <input
                    type="text"
                    value={selectedMeter.lastReadingDate}
                    readOnly
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 bg-gray-100 leading-tight"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Old Meter Closing Reading
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={selectedMeter.closingReading}
                    onChange={(e) => setSelectedMeter({...selectedMeter, closingReading: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
              </div>
            )}
          </form>
          
          <div className="flex justify-center mt-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="changeSimAfter"
                checked={changeSimAfterward}
                onChange={(e) => setChangeSimAfterward(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="changeSimAfter" className="ml-2 block text-sm text-gray-900">
                <strong>Change SIM after meter change?</strong>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end p-4 border-t">
          <button
            onClick={onClose}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded mr-2"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center"
            disabled={loading || !selectedMeter.id}
          >
            {loading ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Processing...
              </>
            ) : (
              <>
                <Save size={16} className="mr-1" /> Submit
              </>
            )}
          </button>
        </div>
      </div>

      {/* Warning Modal for No Previous Meter */}
      {noPreviousMeterWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
            <div className="mb-4 text-center text-red-600 font-bold">No previous meter detected. Please confirm to proceed.</div>
            <div className="flex justify-center">
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                onClick={() => {
                  setNoPreviousMeterWarning(false);
                  setAllowNoOldMeter(true);
                  setTimeout(() => handleSubmit(), 0);
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChangeMeterModal; 