import React, { useState, useEffect } from 'react';
import { 
  searchSims, 
  getSimDetails, 
  changeSim,
  Sim
} from '../services/api';
import { X, Search, Save } from 'lucide-react';
import debounce from 'lodash/debounce';

interface ChangeSimModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteId: string;
  currentSimNum: string;
  onSuccess: () => void;
}

interface SimDetailsState {
  id: number | null;
  simNum: string;
  ctn: string;
  simIp: string;
  assignedDate: string;
}

const ChangeSimModal: React.FC<ChangeSimModalProps> = ({
  isOpen,
  onClose,
  siteId,
  currentSimNum,
  onSuccess
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Sim[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSim, setSelectedSim] = useState<SimDetailsState>({
    id: null,
    simNum: '',
    ctn: '',
    simIp: '',
    assignedDate: new Date().toISOString().split('T')[0]
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSelectedSim, setShowSelectedSim] = useState(false);

  // Debounced search function
  // @ts-expect-error - Ignoring type error with debounce
  const debouncedSearch = debounce((term: string) => {
    if (term.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    searchSims(term)
      .then(results => {
        setSearchResults(results);
      })
      .catch(err => {
        console.error('Error searching SIMs:', err);
        setError('Failed to search SIMs. Please try again.');
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

  // Handle SIM selection
  const handleSelectSim = async (sim: Sim) => {
    if (!sim.id) return;
    
    try {
      setLoading(true);
      const simDetails = await getSimDetails(sim.id);
      
      setSelectedSim({
        id: simDetails.id,
        simNum: simDetails.sim_num || '',
        ctn: simDetails.ctn || '',
        simIp: simDetails.sim_ip || '',
        assignedDate: new Date().toISOString().split('T')[0]
      });
      
      setShowSelectedSim(true);
      setSearchResults([]);
      setSearchTerm('');
    } catch (err) {
      console.error('Error getting SIM details:', err);
      setError('Failed to get SIM details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!selectedSim.id) {
      setError('Please select a SIM first');
      return;
    }

    if (!selectedSim.assignedDate) {
      setError('Assigned date is required');
      return;
    }

    const isConfirmed = window.confirm(
      `This will remove the old SIM ${currentSimNum} and replace it with ${selectedSim.simNum}. Do you want to proceed?`
    );

    if (!isConfirmed) return;

    try {
      setLoading(true);
      await changeSim(siteId, {
        sim_num: selectedSim.simNum,
        assigned_date: selectedSim.assignedDate
      });

      alert('SIM changed successfully');
      onSuccess();
      onClose();
      
      // Reload the page to reflect changes
      window.location.reload();
    } catch (err) {
      console.error('Error changing SIM:', err);
      setError('Failed to change SIM. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Reset state when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setSearchResults([]);
      setSelectedSim({
        id: null,
        simNum: '',
        ctn: '',
        simIp: '',
        assignedDate: new Date().toISOString().split('T')[0]
      });
      setError(null);
      setShowSelectedSim(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">Change SIM</h2>
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
                Search <strong>New</strong> SIM by Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Enter New SIM number"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
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
                  {searchResults.map((sim) => (
                    <div
                      key={sim.id}
                      onClick={() => handleSelectSim(sim)}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                    >
                      <p><strong>{sim.sim_num}</strong> - {sim.ctn}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <input type="hidden" value={currentSimNum} />

            {showSelectedSim && (
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    SIM Number
                  </label>
                  <input
                    type="text"
                    value={selectedSim.simNum}
                    readOnly
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 bg-gray-100 leading-tight"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    CTN
                  </label>
                  <input
                    type="text"
                    value={selectedSim.ctn}
                    readOnly
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 bg-gray-100 leading-tight"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    SIM IP
                  </label>
                  <input
                    type="text"
                    value={selectedSim.simIp}
                    readOnly
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 bg-gray-100 leading-tight"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Assigned Date
                  </label>
                  <input
                    type="date"
                    value={selectedSim.assignedDate}
                    onChange={(e) => setSelectedSim({...selectedSim, assignedDate: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
              </div>
            )}
          </form>
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
            disabled={loading || !showSelectedSim}
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
    </div>
  );
};

export default ChangeSimModal; 