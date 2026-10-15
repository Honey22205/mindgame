import React, { useState, useRef, useEffect } from 'react';
import { Task, CalendarEvent } from '../../types';
import { aiService, ChatMessage } from '../../services/ai';
import { storage } from '../../services/storage';
import { sound } from '../../services/audio';
import { 
  Sparkles, 
  Send, 
  X, 
  Plus, 
  Calendar, 
  Compass, 
  CheckCircle2, 
  Loader2, 
  Bot, 
  User,
  ArrowUp
} from 'lucide-react';

interface Props {
  tasks: Task[];
  events: CalendarEvent[];
  isOpen: boolean;
  onClose: () => void;
  onOpenTaskModal: (task?: Task) => void;
}

export const AIAssistantSheet: React.FC<Props> = ({
  tasks,
  events,
  isOpen,
  onClose,
  onOpenTaskModal,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      role: 'model',
      content: "NEXUS Copilot online. I've indexed your active workload and calendar schedule. How can I assist your execution today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const quickPrompts = [
    'Break down top priority into 15m steps',
    'Schedule design review tomorrow 2pm #design',
    'What should I tackle next?',
    'Analyze my calendar for focus buffers',
  ];

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    sound.playTap();
    setInputText('');

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const pendingTasks = tasks.filter((t) => !t.isCompleted).map((t) => t.title);
      const nextEvents = events.map((e) => `${e.title} at ${e.startTime}`);

      const response = await aiService.chatCopilot(
        text,
        messages.map((m) => ({ role: m.role, content: m.content })),
        {
          tasksCount: tasks.length,
          pendingTasks,
          nextEvents,
        }
      );

      const aiMsg: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        role: 'model',
        content: response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      sound.playSuccess();
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-err`,
          role: 'model',
          content: 'Unable to reach Gemini neural service. Operating on local heuristics.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md bg-[#0f121d] border border-white/10 rounded-t-3xl sm:rounded-2xl h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-[#131726]/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white tracking-tight">NEXUS Copilot</h3>
              <span className="text-[10px] text-cyan-400 font-mono">Gemini 3.8 Flash Engine</span>
            </div>
          </div>

          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Thread (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] rounded-2xl p-3 text-xs leading-relaxed ${
                    isUser
                      ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white rounded-tr-sm shadow-md'
                      : 'glass-card border border-white/10 text-slate-200 rounded-tl-sm'
                  }`}
                >
                  <p className="whitespace-pre-line">{m.content}</p>
                  <span className="block text-[9px] text-white/50 text-right mt-1 font-mono">
                    {m.timestamp}
                  </span>
                </div>

                {isUser && (
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-2.5 items-center text-slate-400 text-xs">
              <div className="w-6 h-6 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              </div>
              <span className="italic">NEXUS is thinking...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-3 py-1.5 border-t border-white/5 bg-[#121524] overflow-x-auto no-scrollbar flex items-center gap-1.5 shrink-0">
          {quickPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSend(prompt)}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-slate-300 hover:text-white whitespace-nowrap transition-colors border border-white/5"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-white/5 bg-[#0f121d] shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask anything or state an objective..."
              className="flex-1 bg-[#161a29] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="w-9 h-9 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white flex items-center justify-center disabled:opacity-30 hover:brightness-110 active:scale-95 transition-all shrink-0 cursor-pointer"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
