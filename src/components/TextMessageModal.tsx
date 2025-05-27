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
  site_name?: string;
  created_by: number;
  created_at: string;
  last_message_at: string;
  number?: string;
}

interface SMSMessage {
  id: number;
  chat: number;
  user: number | null;
  user_username?: string | null;
  site: number;
  direction: 'sent' | 'received';
  direction_display?: string;
  body: string;
  timestamp: string;
  twilio_sid: string | null;
  status: 'queued' | 'sent' | 'delivered' | 'failed' | 'received';
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

  // Initialize chat for site using get-or-create endpoint
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    async function initializeChat() {
      try {
        // Use get-or-create endpoint to ensure we have a chat
        const res = await api.post('/sms-chats/get-or-create/', { site_id: parseInt(siteId) });
        const chat = res.data.chat;
        setChats([chat]);
        setSelectedChat(chat);
      } catch (err) {
        console.error('Failed to initialize chat:', err);
        setError('Failed to initialize chat.');
      } finally {
        setLoading(false);
      }
    }
    initializeChat();
  }, [isOpen, siteId]);

  // Fetch messages for selected chat and poll for updates
  useEffect(() => {
    if (!selectedChat) return;
    let cancelled = false;
    async function fetchMessages() {
      try {
        const res = await api.get(`/sms-chats/${selectedChat.id}/messages/`);
        if (!cancelled) {
          setMessages(res.data);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to fetch messages:', err);
          setError('Failed to load messages.');
        }
      }
    }
    fetchMessages();
    // Poll every 30 seconds for new messages
    const interval = setInterval(fetchMessages, 30000);
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
      // Send message with optional to_number parameter
      const payload: any = { body: input };
      if (numberSelector && numberSelector !== numberOptions[0]) {
        payload.to_number = numberSelector;
      }
      
      const sendRes = await api.post(`/sms-chats/${selectedChat.id}/send-message/`, payload);
      
      // Add the new message to the list immediately
      setMessages(prev => [...prev, sendRes.data]);
      setInput('');
      
      // Refresh messages to ensure sync
      const res = await api.get(`/sms-chats/${selectedChat.id}/messages/`);
      setMessages(res.data);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to send message.';
      setError(errorMsg);
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
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl h-[700px] flex relative overflow-hidden">
        {/* Sidebar: Chat history */}
        <div className="w-72 bg-gray-100 dark:bg-gray-900 border-r dark:border-gray-700 flex flex-col">
          <div className="p-4 border-b dark:border-gray-700 font-bold text-lg text-gray-700 dark:text-gray-300">Chat History</div>
          <div className="flex-1 overflow-y-auto">
            {chats.length === 0 && <div className="text-gray-400 dark:text-gray-500 text-center mt-8">No chats yet.</div>}
            {(Array.isArray(chats) ? chats : []).map(chat => (
              <div
                key={chat.id}
                className={`px-4 py-3 cursor-pointer rounded-lg m-2 transition-all ${selectedChat?.id === chat.id ? 'bg-green-200 dark:bg-green-700' : 'hover:bg-gray-200 dark:hover:bg-gray-800'}`}
                onClick={() => setSelectedChat(chat)}
              >
                <div className="font-semibold text-green-700 dark:text-green-300 truncate">{chat.site_name || site?.site_name || `Site ${chat.site}`}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{chat.last_message_at ? new Date(chat.last_message_at).toLocaleString() : ''}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Main chat area */}
        <div className="flex-1 flex flex-col">
          {/* Header: Customer/Landlord details */}
          <div className="p-4 border-b dark:border-gray-700 flex items-center gap-4 bg-white dark:bg-gray-800 rounded-t-2xl">
            <div className="flex-1">
              <div className="font-bold text-lg text-green-700 dark:text-green-400">{customer?.owner || 'Customer'}</div>
              {customer?.email && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <a href={`mailto:${customer.email}`} className="hover:underline hover:text-blue-600 dark:hover:text-blue-400">
                    {customer.email}
                  </a>
                </div>
              )}
              {customer?.phone && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <a href={`tel:${customer.phone}`} className="hover:underline hover:text-blue-600 dark:hover:text-blue-400">
                    {customer.phone}
                  </a>
                </div>
              )}
              <div className="text-xs text-gray-400 dark:text-gray-500">{customer?.owner_address || ''}</div>
            </div>
            <button className="rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 p-2 dark:text-gray-300" onClick={onClose}><CloseIcon /></button>
          </div>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-8 py-4 bg-gray-50 dark:bg-gray-900">
            {loading ? (
              <div className="flex items-center justify-center h-full"><CircularProgress /></div>
            ) : error ? (
              <div className="flex items-center justify-center text-red-500 h-full">{error}</div>
            ) : messages.length === 0 ? (
              <div className="text-gray-400 dark:text-gray-500 text-center mt-8">No messages yet.</div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.direction === 'sent' ? 'justify-end' : 'justify-start'} mb-2`}>
                  <div className={`max-w-[70%] px-5 py-3 rounded-2xl shadow text-base ${msg.direction === 'sent' ? 'bg-green-500 dark:bg-green-600 text-white rounded-br-none' : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none border dark:border-gray-600'}`}>
                    <div>{msg.body}</div>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <div className="text-xs text-gray-200 dark:text-gray-400">{new Date(msg.timestamp).toLocaleString()}</div>
                      {msg.direction === 'sent' && (
                        <div className="text-xs text-gray-200 dark:text-gray-400">
                          {msg.status === 'queued' && '⏳'}
                          {msg.status === 'sent' && '✓'}
                          {msg.status === 'delivered' && '✓✓'}
                          {msg.status === 'failed' && '❌'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          {/* Number selector, canned, input, send */}
          <div className="p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col gap-2 rounded-b-2xl">
            <div className="flex gap-2 items-center mb-2">
              <select
                className="border border-gray-300 dark:border-gray-600 rounded-full px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-400 dark:focus:ring-green-500"
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
                className="rounded-full bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800 p-2 flex items-center justify-center border border-green-300 dark:border-green-700 text-green-700 dark:text-green-300"
                onClick={() => setAddingNumber(v => !v)}
                title="Add new number"
              >
                <AddIcon fontSize="small" />
              </button>
              {addingNumber && (
                <>
                  <input
                    className="border border-gray-300 dark:border-gray-600 rounded-full px-3 py-2 text-sm ml-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
                className="border border-gray-300 dark:border-gray-600 rounded-full px-2 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={selectedCanned}
                onChange={handleCannedSelect}
              >
                <option value="">Canned messages...</option>
                {cannedMessages.map(m => (
                  <option key={m.id} value={m.id}>{m.text.slice(0, 40)}</option>
                ))}
              </select>
              <textarea
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-2xl px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none min-h-[40px] max-h-[120px]"
                placeholder="Type your message..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                disabled={sending}
                rows={1}
                style={{ height: 'auto', overflow: 'hidden' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
                }}
              />
              <button
                className="rounded-full px-6 py-2 bg-green-600 text-white font-semibold disabled:opacity-50 shadow-lg hover:bg-green-700 transition-all"
                onClick={handleSend}
                disabled={sending || !input.trim()}
              >
                {sending ? <CircularProgress size={20} /> : 'Send'}
              </button>
            </div>
            {error && <div className="text-red-500 dark:text-red-400 text-sm mt-1">{error}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextMessageModal; 