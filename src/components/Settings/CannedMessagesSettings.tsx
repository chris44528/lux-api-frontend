import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import CircularProgress from '@mui/material/CircularProgress';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

interface SMSCannedMessage {
  id: number;
  text: string;
}

const CannedMessagesSettings: React.FC = () => {
  const [messages, setMessages] = useState<SMSCannedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editMessage, setEditMessage] = useState<SMSCannedMessage | null>(null);
  const [formText, setFormText] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await api.get('/sms-canned-messages/');
      setMessages(res.data.results || res.data || []);
      setError(null);
    } catch {
      setError('Failed to load canned messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMessages(); }, []);

  const openModal = (msg?: SMSCannedMessage) => {
    setEditMessage(msg || null);
    setFormText(msg ? msg.text : '');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditMessage(null);
    setFormText('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editMessage) {
        await api.put(`/sms-canned-messages/${editMessage.id}/`, { text: formText });
      } else {
        await api.post('/sms-canned-messages/', { text: formText });
      }
      fetchMessages();
      closeModal();
    } catch {
      setError('Failed to save message');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this canned message?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/sms-canned-messages/${id}/`);
      fetchMessages();
    } catch {
      setError('Failed to delete message');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-white rounded shadow p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Canned SMS Messages</h2>
        <button
          className="rounded-full bg-green-600 text-white p-2 hover:bg-green-700"
          onClick={() => openModal()}
          title="Add Canned Message"
        >
          <AddIcon />
        </button>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-8"><CircularProgress /></div>
      ) : error ? (
        <div className="text-red-500 text-center py-8">{error}</div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left px-4 py-2">Message</th>
              <th className="text-right px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {messages.map(msg => (
              <tr key={msg.id} className="border-b">
                <td className="px-4 py-2">{msg.text}</td>
                <td className="px-4 py-2 text-right flex gap-2 justify-end">
                  <button
                    className="rounded-full bg-blue-100 text-blue-700 p-2 hover:bg-blue-200"
                    onClick={() => openModal(msg)}
                    title="Edit"
                  >
                    <EditIcon fontSize="small" />
                  </button>
                  <button
                    className="rounded-full bg-red-100 text-red-700 p-2 hover:bg-red-200"
                    onClick={() => handleDelete(msg.id)}
                    disabled={deletingId === msg.id}
                    title="Delete"
                  >
                    {deletingId === msg.id ? <CircularProgress size={18} /> : <DeleteIcon fontSize="small" />}
                  </button>
                </td>
              </tr>
            ))}
            {messages.length === 0 && (
              <tr><td colSpan={2} className="text-center text-gray-400 py-8">No canned messages found.</td></tr>
            )}
          </tbody>
        </table>
      )}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-2">{editMessage ? 'Edit Canned Message' : 'Add Canned Message'}</h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <label className="font-semibold">Message
                <textarea
                  className="border rounded px-2 py-1 w-full mt-1 min-h-[80px]"
                  value={formText}
                  onChange={e => setFormText(e.target.value)}
                  required
                  maxLength={320}
                  placeholder="Enter canned message text..."
                />
              </label>
              <div className="flex gap-2 mt-4">
                <button type="button" className="px-4 py-2 rounded bg-gray-200" onClick={closeModal}>Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-green-600 text-white" disabled={saving}>{saving ? 'Saving...' : (editMessage ? 'Save' : 'Add')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CannedMessagesSettings; 