import React, { useState, useEffect } from 'react';
import { 
  getMeterHistory, 
  createMeterHistory, 
  updateMeterHistory, 
  deleteMeterHistory,
  MeterHistory
} from '../services/api';
import { Meter } from '../types/api';
import { X, Edit, Save, Trash2, Plus, Search } from 'lucide-react';

interface MeterHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteId: string;
  siteName: string;
  siteReference: string;
  availableMeters: Meter[];
}

interface EditingState {
  id: number | null;
  oldMeterSerial: number | null;
  closingReading: string;
  changeDate: string;
  newMeterSerial: string;
  openingReading: string;
}

const MeterHistoryModal: React.FC<MeterHistoryModalProps> = ({
  isOpen,
  onClose,
  siteId,
  siteName,
  siteReference,
  availableMeters
}) => {
  const [meterHistory, setMeterHistory] = useState<MeterHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EditingState>({
    id: null,
    oldMeterSerial: null,
    closingReading: '',
    changeDate: '',
    newMeterSerial: '',
    openingReading: ''
  });
  const [meterSearchTerm, setMeterSearchTerm] = useState('');
  const [filteredMeters, setFilteredMeters] = useState<Meter[]>([]);

  useEffect(() => {
    if (isOpen && siteId) {
      loadMeterHistory();
    }
  }, [isOpen, siteId]);

  useEffect(() => {
    if (meterSearchTerm.length > 0) {
      const filtered = availableMeters.filter(meter => 
        meter.MeterSerial?.toLowerCase().includes(meterSearchTerm.toLowerCase())
      );
      setFilteredMeters(filtered);
    } else {
      setFilteredMeters([]);
    }
  }, [meterSearchTerm, availableMeters]);

  const loadMeterHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMeterHistory(siteId);
      setMeterHistory(data);
    } catch (err) {
      setError('Failed to load meter history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingItem({
      id: null,
      oldMeterSerial: null,
      closingReading: '',
      changeDate: new Date().toISOString().split('T')[0],
      newMeterSerial: '',
      openingReading: ''
    });
    setIsAddModalOpen(true);
  };

  const handleEdit = (item: MeterHistory) => {
    setEditingItem({
      id: item.id,
      oldMeterSerial: item.Old_MeterSerial,
      closingReading: item.closing_reading,
      changeDate: item.change_date,
      newMeterSerial: item.New_MeterSerial,
      openingReading: item.new_meter_opening_reading
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this meter change record?')) {
      try {
        await deleteMeterHistory(id);
        setMeterHistory(prevHistory => prevHistory.filter(item => item.id !== id));
      } catch (err) {
        setError('Failed to delete meter history. Please try again.');
      }
    }
  };

  const handleSaveAdd = async () => {
    try {
      if (!editingItem.oldMeterSerial) {
        setError('Please select an old meter');
        return;
      }

      const newItem = await createMeterHistory({
        site_id: Number(siteId),
        Old_MeterSerial: editingItem.oldMeterSerial,
        New_MeterSerial: editingItem.newMeterSerial,
        closing_reading: editingItem.closingReading,
        change_date: editingItem.changeDate,
        new_meter_opening_reading: editingItem.openingReading
      });

      setMeterHistory(prevHistory => [newItem, ...prevHistory]);
      setIsAddModalOpen(false);
    } catch (err) {
      setError('Failed to add meter history. Please try again.');
    }
  };

  const handleSaveEdit = async () => {
    try {
      if (!editingItem.id) return;

      const updatedItem = await updateMeterHistory(editingItem.id, {
        Old_MeterSerial: editingItem.oldMeterSerial || undefined,
        New_MeterSerial: editingItem.newMeterSerial,
        closing_reading: editingItem.closingReading,
        change_date: editingItem.changeDate,
        new_meter_opening_reading: editingItem.openingReading
      });

      setMeterHistory(prevHistory => 
        prevHistory.map(item => item.id === editingItem.id ? updatedItem : item)
      );
      setIsEditModalOpen(false);
    } catch (err) {
      setError('Failed to update meter history. Please try again.');
    }
  };

  const handleSelectMeter = (meter: Meter) => {
    if (meter.id !== undefined) {
      setEditingItem(prev => ({
        ...prev,
        oldMeterSerial: meter.id
      }));
    }
    setMeterSearchTerm('');
    setFilteredMeters([]);
  };

  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold dark:text-white">Meter History</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleAddNew}
              className="bg-green-600 text-white px-3 py-2 rounded flex items-center"
            >
              <Plus size={16} className="mr-1" /> Add New Meter Change
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-4 overflow-auto flex-grow">
          {error && (
            <div className="bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 dark:border-green-400"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Site Reference
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      FCO
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Old Meter Serial
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Closing Reading
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Change Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      New Meter Serial
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Opening Reading
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {meterHistory.length > 0 ? (
                    meterHistory.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap dark:text-gray-100">{siteName}</td>
                        <td className="px-6 py-4 whitespace-nowrap dark:text-gray-100">{siteReference}</td>
                        <td className="px-6 py-4 whitespace-nowrap dark:text-gray-100">{item.old_meter_serial}</td>
                        <td className="px-6 py-4 whitespace-nowrap dark:text-gray-100">{item.closing_reading}</td>
                        <td className="px-6 py-4 whitespace-nowrap dark:text-gray-100">{formatDate(item.change_date)}</td>
                        <td className="px-6 py-4 whitespace-nowrap dark:text-gray-100">{item.New_MeterSerial}</td>
                        <td className="px-6 py-4 whitespace-nowrap dark:text-gray-100">{item.new_meter_opening_reading}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(item)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                        No meter history records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="p-4 border-t dark:border-gray-700">
          <button
            onClick={onClose}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
          >
            Close
          </button>
        </div>
      </div>

      {/* Add New Meter Change Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
              <h3 className="text-lg font-medium dark:text-white">Add New Meter Change</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <form>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Old Meter Serial
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={meterSearchTerm}
                      onChange={(e) => setMeterSearchTerm(e.target.value)}
                      placeholder="Search meter by serial number"
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <Search size={16} className="text-gray-400" />
                    </div>
                  </div>
                  {filteredMeters.length > 0 && (
                    <div className="mt-2 max-h-40 overflow-y-auto border rounded shadow-sm">
                      {filteredMeters.map((meter) => (
                        <div
                          key={meter.MeterSerial}
                          onClick={() => handleSelectMeter(meter)}
                          className="p-2 hover:bg-gray-100 cursor-pointer"
                        >
                          {meter.MeterSerial}
                        </div>
                      ))}
                    </div>
                  )}
                  {editingItem.oldMeterSerial && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                      Selected: {availableMeters.find(m => m.id === editingItem.oldMeterSerial)?.MeterSerial}
                    </div>
                  )}
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Closing Reading
                  </label>
                  <input
                    type="text"
                    value={editingItem.closingReading}
                    onChange={(e) => setEditingItem({...editingItem, closingReading: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Change Date
                  </label>
                  <input
                    type="date"
                    value={editingItem.changeDate}
                    onChange={(e) => setEditingItem({...editingItem, changeDate: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    New Meter Serial
                  </label>
                  <input
                    type="text"
                    value={editingItem.newMeterSerial}
                    onChange={(e) => setEditingItem({...editingItem, newMeterSerial: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Opening Reading
                  </label>
                  <input
                    type="text"
                    value={editingItem.openingReading}
                    onChange={(e) => setEditingItem({...editingItem, openingReading: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
              </form>
            </div>
            <div className="flex justify-end p-4 border-t">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded mr-2"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAdd}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center"
              >
                <Save size={16} className="mr-1" /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Meter Change Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-medium">Edit Meter Change</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <form>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Old Meter Serial
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={meterSearchTerm}
                      onChange={(e) => setMeterSearchTerm(e.target.value)}
                      placeholder="Search meter by serial number"
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <Search size={16} className="text-gray-400" />
                    </div>
                  </div>
                  {filteredMeters.length > 0 && (
                    <div className="mt-2 max-h-40 overflow-y-auto border rounded shadow-sm">
                      {filteredMeters.map((meter) => (
                        <div
                          key={meter.MeterSerial}
                          onClick={() => handleSelectMeter(meter)}
                          className="p-2 hover:bg-gray-100 cursor-pointer"
                        >
                          {meter.MeterSerial}
                        </div>
                      ))}
                    </div>
                  )}
                  {editingItem.oldMeterSerial && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                      Selected: {availableMeters.find(m => m.id === editingItem.oldMeterSerial)?.MeterSerial}
                    </div>
                  )}
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Closing Reading
                  </label>
                  <input
                    type="text"
                    value={editingItem.closingReading}
                    onChange={(e) => setEditingItem({...editingItem, closingReading: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Change Date
                  </label>
                  <input
                    type="date"
                    value={editingItem.changeDate}
                    onChange={(e) => setEditingItem({...editingItem, changeDate: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    New Meter Serial
                  </label>
                  <input
                    type="text"
                    value={editingItem.newMeterSerial}
                    onChange={(e) => setEditingItem({...editingItem, newMeterSerial: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Opening Reading
                  </label>
                  <input
                    type="text"
                    value={editingItem.openingReading}
                    onChange={(e) => setEditingItem({...editingItem, openingReading: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
              </form>
            </div>
            <div className="flex justify-end p-4 border-t">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded mr-2"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center"
              >
                <Save size={16} className="mr-1" /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeterHistoryModal; 