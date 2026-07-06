import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Bot, User } from 'lucide-react';
import { api } from '../services/api';

interface Props { onClose: () => void; }

const SUGGESTED = ['Best time to visit Bali?', 'Modify my itinerary', 'Visa requirements for Japan', 'Budget hotels in Thailand'];

const Chatbot: React.FC<Props> = ({ onClose }) => {
  const [messages, setMessages] = useState([
    { role: 'ai', content: 'Hi! I\'m AtlasAI, your intelligent travel companion. I can help you plan trips, answer questions, and modify your itinerary. How can I help?' }
  ]);
  const [input, setInput] = useState('');

  const send = async (text: string) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    try {
      const res = await api.chat.send(text);
      setMessages(prev => [...prev, { role: 'ai', content: res.data.reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I'm having trouble connecting to the server right now." }]);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed bottom-24 right-6 w-80 md:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
      style={{ height: '520px' }}
    >
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-blue-600 to-teal-500 flex justify-between items-center">
        <div className="flex items-center text-white font-bold">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mr-2">
            <Bot className="w-4 h-4" />
          </div>
          AtlasAI Assistant
          <div className="ml-2 w-2 h-2 bg-green-300 rounded-full animate-pulse" />
        </div>
        <button onClick={onClose} className="text-white/80 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50">
        {messages.map((msg, i) => (
          <div key={i} className={`flex items-start gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-blue-600' : 'bg-gradient-to-br from-blue-500 to-teal-400'}`}>
              {msg.role === 'user' ? <User className="w-3.5 h-3.5 text-white" /> : <Bot className="w-3.5 h-3.5 text-white" />}
            </div>
            <div className={`p-3 rounded-2xl max-w-[80%] text-sm leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-slate-700 shadow-sm border border-slate-100 rounded-tl-none'}`}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      {/* Suggestions */}
      {messages.length === 1 && (
        <div className="px-4 pb-3 bg-slate-50">
          <div className="text-xs text-slate-400 font-medium mb-2">Quick Questions</div>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED.map((s, i) => (
              <button key={i} onClick={() => send(s)} className="bg-blue-50 hover:bg-blue-100 text-blue-600 text-[11px] font-semibold px-3 py-1.5 rounded-full transition-colors border border-blue-100">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 bg-white border-t border-slate-100">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Ask me anything about your trip…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send(input)}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-400 text-slate-800"
          />
          <button onClick={() => send(input)} className="bg-gradient-to-r from-blue-600 to-teal-500 text-white p-3 rounded-xl hover:opacity-90 transition-opacity">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default Chatbot;
