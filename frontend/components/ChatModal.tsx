"use client";
import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { fetchApi, API_URL } from '@/lib/api';

// Derive the socket URL from the API_URL (remove /api if present)
const SOCKET_URL = API_URL.replace(/\/api\/?$/, '');

export default function ChatModal({ booking, onClose, currentUser }: any) {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isClosed = ['returned', 'cancelled', 'rejected'].includes(booking.status);

  useEffect(() => {
    let isMounted = true;

    fetchApi(`/bookings/${booking.id}/messages?limit=100`)
      .then((data) => {
        if (!isMounted) return;
        setMessages(data);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Failed to load messages');
        setLoading(false);
      });

    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token }
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_room', { booking_id: booking.id });
    });

    socket.on('new_message', (msg) => {
      setMessages((prev) => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    socket.on('room_error', (msg) => {
      console.error('Socket room error:', msg);
    });

    return () => {
      isMounted = false;
      socket.disconnect();
    };
  }, [booking.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const msgText = inputText;
    setInputText('');

    try {
      const savedMsg = await fetchApi(`/bookings/${booking.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ body: msgText }),
      });
      
      setMessages((prev) => {
        if (prev.some(m => m.id === savedMsg.id)) return prev;
        return [...prev, savedMsg];
      });
    } catch (err: any) {
      alert(err.message || 'Failed to send message');
      // Optionally, restore input text on failure
      setInputText(msgText);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col h-[600px] max-h-[90vh]">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50 rounded-t-2xl">
          <h3 className="font-bold text-lg text-slate-800">Chat: {booking.item.title}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 text-2xl leading-none">&times;</button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 bg-slate-100 flex flex-col gap-3">
          {loading ? (
            <p className="text-center text-slate-500 my-auto">Loading chat...</p>
          ) : error ? (
            <p className="text-center text-red-500 my-auto">{error}</p>
          ) : messages.length === 0 ? (
            <p className="text-center text-slate-500 my-auto">No messages yet. Say hello!</p>
          ) : (
            messages.map((msg, idx) => {
              const isMe = msg.sender_id === currentUser?.id;
              return (
                <div key={msg.id || idx} className={`flex flex-col max-w-[80%] ${isMe ? 'self-end' : 'self-start'}`}>
                  <span className={`text-xs mb-1 mx-1 text-slate-500 ${isMe ? 'text-right' : 'text-left'}`}>
                    {msg.sender?.name || 'User'}
                  </span>
                  <div className={`p-3 rounded-2xl ${isMe ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'}`}>
                    {msg.body}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t bg-white rounded-b-2xl">
          {isClosed ? (
            <div className="text-center p-3 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium">
              This rental is {booking.status}. The chat is closed.
            </div>
          ) : (
            <form onSubmit={sendMessage} className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type a message..."
                maxLength={1000}
                className="flex-1 border border-slate-300 rounded-xl px-4 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="bg-indigo-600 text-white px-5 py-2 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Send
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
