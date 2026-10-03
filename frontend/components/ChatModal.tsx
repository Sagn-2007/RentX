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
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-lg flex flex-col h-[600px] max-h-[90vh]">
        <div className="p-4 border-b flex justify-between items-center bg-background rounded-t-2xl">
          <h3 className="font-bold text-lg text-text-primary">Chat: {booking.item.title}</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary text-2xl leading-none">&times;</button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 bg-zinc-100 flex flex-col gap-3">
          {loading ? (
            <p className="text-center text-text-muted my-auto">Loading chat...</p>
          ) : error ? (
            <p className="text-center text-red-500 my-auto">{error}</p>
          ) : messages.length === 0 ? (
            <p className="text-center text-text-muted my-auto">No messages yet. Say hello!</p>
          ) : (
            messages.map((msg, idx) => {
              const isMe = msg.sender_id === currentUser?.id;
              return (
                <div key={msg.id || idx} className={`flex flex-col max-w-[80%] ${isMe ? 'self-end' : 'self-start'}`}>
                  <span className={`text-xs mb-1 mx-1 text-text-muted ${isMe ? 'text-right' : 'text-left'}`}>
                    {msg.sender?.name || 'User'}
                  </span>
                  <div className={`p-3 rounded-lg ${isMe ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-surface border border-text-secondary/20 text-text-primary rounded-tl-sm'}`}>
                    {msg.body}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t bg-surface rounded-b-2xl">
          {isClosed ? (
            <div className="text-center p-3 bg-zinc-100 text-text-secondary rounded-lg text-sm font-medium">
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
                className="flex-1 border border-text-secondary/20 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
