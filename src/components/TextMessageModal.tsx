import React, { useEffect, useState, useRef } from 'react';
import { api } from '../services/api';
import CloseIcon from '@mui/icons-material/Close';
import CircularProgress from '@mui/material/CircularProgress';
import AddIcon from '@mui/icons-material/Add';

interface CustomerType {
  owner?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  owner_address?: string;
}

interface SimType {
  sim_num?: string;
  ctn?: string;
}

interface TextMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteId: string;
  customer: CustomerType;
  sim: SimType;
  site: any;
}

interface SMSChat {
  id: number;
  site: number;
  created_by: number;
  created_at: string;
  last_message_at: string;
  number?: string;
}

interface SMSMessage {
  id: number;
  chat: number;
  user: number | null;
  user_username: string | null;
  site: number;
  direction: 'sent' | 'received';
  direction_display: string;
  body: string;
  timestamp: string;
  twilio_sid: string | null;
  status: string;
}

interface SMSCannedMessage {
  id: number;
  text: string;
}

const getNumbersForSelector = (customer: CustomerType, sim: SimType, chats: SMSChat[]): string[] => {
  const numbers = new Set<string>();
  if (customer?.phone) numbers.add(customer.phone);
  if (customer?.mobile) numbers.add(customer.mobile);
  if (sim?.sim_num) numbers.add(sim.sim_num);
  if (sim?.ctn) numbers.add(sim.ctn);
  (Array.isArray(chats) ? chats : []).forEach(chat => { if (chat.number) numbers.add(chat.number); });
  return Array.from(numbers).filter(Boolean);
};

const TextMessageModal: React.FC<TextMessageModalProps> = ({ isOpen, onClose, siteId, customer, sim, site }) => {
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState<SMSChat[]>([]);
  const [selectedChat, setSelectedChat] = useState<SMSChat | null>(null);
  const [messages, setMessages] = useState<SMSMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [cannedMessages, setCannedMessages] = useState<SMSCannedMessage[]>([]);
  const [selectedCanned, setSelectedCanned] = useState<number | ''>('');
  const [error, setError] = useState<string | null>(null);
  const [numberSelector, setNumberSelector] = useState('');
  const [addingNumber, setAddingNumber] = useState(false);
  const [newNumber, setNewNumber] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Fetch all chats for site
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    async function fetchChats() {
      try {
        const res = await api.get(`/sms-chats/?site_id=${siteId}`);
        const chatArr = Array.isArray(res.data) ? res.data : [];
        setChats(chatArr);
        if (chatArr.length > 0) {
          setSelectedChat(chatArr[0]);
        } else {
          const createRes = await api.post('/sms-chats/', { site: siteId });
          setChats([createRes.data]);
          setSelectedChat(createRes.data);
        }
      } catch {
        setError('Failed to load chats.');
      } finally {
        setLoading(false);
      }
    }
    fetchChats();
  }, [isOpen, siteId]);

  // Fetch messages for selected chat
  useEffect(() => {
    if (!selectedChat) return;
    let cancelled = false;
    async function fetchMessages() {
      try {
        const res = await api.get(`/sms-chats/${selectedChat.id}/messages/`);
        if (!cancelled) setMessages(res.data);
      } catch {
        if (!cancelled) setError('Failed to load messages.');
      }
    }
    fetchMessages();
    const interval = setInterval(fetchMessages, 10000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [selectedChat]);

  // Fetch canned messages
  useEffect(() => {
    if (!isOpen) return;
    api.get('/sms-canned-messages/').then(res => {
      setCannedMessages(res.data.results || res.data || []);
    });
  }, [isOpen]);

  // Number selector options
  const numberOptions = getNumbersForSelector(customer, sim, chats);

  // Set default number selector
  useEffect(() => {
    if (numberOptions.length > 0 && !numberSelector) {
      setNumberSelector(numberOptions[0]);
    }
  }, [numberOptions, numberSelector]);

  const handleSend = async () => {
    if (!input.trim() || !selectedChat) return;
    setSending(true);
    setError(null);
    try {
      await api.post(`/sms-chats/${selectedChat.id}/send-message/`, { body: input, number: numberSelector });
      setInput('');
      const res = await api.get(`/sms-chats/${selectedChat.id}/messages/`);
      setMessages(res.data);
    } catch {
      setError('Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleCannedSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value === '' ? '' : Number(e.target.value);
    setSelectedCanned(val);
    const canned = cannedMessages.find(m => m.id === Number(val));
    if (canned) setInput(canned.text);
  };

  const handleAddNumber = () => {
    if (newNumber && !numberOptions.includes(newNumber)) {
      setNumberSelector(newNumber);
      setAddingNumber(false);
      setNewNumber('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[700px] flex relative overflow-hidden">
        {/* Sidebar: Chat history */}
        <div className="w-72 bg-gray-100 border-r flex flex-col">
          <div className="p-4 border-b font-bold text-lg text-gray-700">Chat History</div>
          <div className="flex-1 overflow-y-auto">
            {chats.length === 0 && <div className="text-gray-400 text-center mt-8">No chats yet.</div>}
            {(Array.isArray(chats) ? chats : []).map(chat => (
              <div
                key={chat.id}
                className={`px-4 py-3 cursor-pointer rounded-lg m-2 transition-all ${selectedChat?.id === chat.id ? 'bg-green-200' : 'hover:bg-gray-200'}`}
                onClick={() => setSelectedChat(chat)}
              >
                <div className="font-semibold text-green-700 truncate">{chat.number || numberOptions[0] || 'Unknown Number'}</div>
                <div className="text-xs text-gray-500 truncate">{chat.last_message_at ? new Date(chat.last_message_at).toLocaleString() : ''}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Main chat area */}
        <div className="flex-1 flex flex-col">
          {/* Header: Customer/Landlord details */}
          <div className="p-4 border-b flex items-center gap-4 bg-white rounded-t-2xl">
            <div className="flex-1">
              <div className="font-bold text-lg text-green-700">{customer?.owner || 'Customer'}</div>
              <div className="text-sm text-gray-600">{customer?.email || ''}</div>
              <div className="text-sm text-gray-600">{customer?.phone || ''}</div>
              <div className="text-xs text-gray-400">{customer?.owner_address || ''}</div>
            </div>
            <button className="rounded-full bg-gray-200 hover:bg-gray-300 p-2" onClick={onClose}><CloseIcon /></button>
          </div>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-8 py-4 bg-gray-50">
            {loading ? (
              <div className="flex items-center justify-center h-full"><CircularProgress /></div>
            ) : error ? (
              <div className="flex items-center justify-center text-red-500 h-full">{error}</div>
            ) : messages.length === 0 ? (
              <div className="text-gray-400 text-center mt-8">No messages yet.</div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.direction === 'sent' ? 'justify-end' : 'justify-start'} mb-2`}>
                  <div className={`max-w-[70%] px-5 py-3 rounded-2xl shadow text-base ${msg.direction === 'sent' ? 'bg-green-500 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none border'}`}>
                    <div>{msg.body}</div>
                    <div className="text-xs text-gray-200 mt-1 text-right">{new Date(msg.timestamp).toLocaleString()}</div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          {/* Number selector, canned, input, send */}
          <div className="p-4 border-t bg-white flex flex-col gap-2 rounded-b-2xl">
            <div className="flex gap-2 items-center mb-2">
              <select
                className="border rounded-full px-3 py-2 text-sm focus:ring-2 focus:ring-green-400"
                value={numberSelector}
                onChange={e => setNumberSelector(e.target.value)}
              >
                {numberOptions.map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
                {addingNumber && (
                  <option value={newNumber}>{newNumber}</option>
                )}
              </select>
              <button
                className="rounded-full bg-green-100 hover:bg-green-200 p-2 flex items-center justify-center border border-green-300"
                onClick={() => setAddingNumber(v => !v)}
                title="Add new number"
              >
                <AddIcon fontSize="small" />
              </button>
              {addingNumber && (
                <>
                  <input
                    className="border rounded-full px-3 py-2 text-sm ml-2"
                    type="text"
                    placeholder="Enter new number"
                    value={newNumber}
                    onChange={e => setNewNumber(e.target.value)}
                  />
                  <button
                    className="rounded-full bg-green-500 text-white px-4 py-2 ml-2 font-semibold"
                    onClick={handleAddNumber}
                    disabled={!newNumber.trim()}
                  >Add</button>
                </>
              )}
            </div>
            <div className="flex gap-2 items-center">
              <select
                className="border rounded-full px-2 py-2 text-sm"
                value={selectedCanned}
                onChange={handleCannedSelect}
              >
                <option value="">Canned messages...</option>
                {cannedMessages.map(m => (
                  <option key={m.id} value={m.id}>{m.text.slice(0, 40)}</option>
                ))}
              </select>
              <input
                className="flex-1 border rounded-full px-3 py-2 text-sm"
                type="text"
                placeholder="Type your message..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
                disabled={sending}
              />
              <button
                className="rounded-full px-6 py-2 bg-green-600 text-white font-semibold disabled:opacity-50 shadow-lg hover:bg-green-700 transition-all"
                onClick={handleSend}
                disabled={sending || !input.trim()}
              >
                {sending ? <CircularProgress size={20} /> : 'Send'}
              </button>
            </div>
            {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextMessageModal; 