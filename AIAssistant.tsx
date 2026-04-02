import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, X, Minimize2, Maximize2, Loader2, MessageSquare, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { Shipment, Order } from '../types';
import { cn } from '../lib/utils';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface AIAssistantProps {
  shipments: Shipment[];
  orders: Order[];
  onSelectOrder?: (orderNumber: string) => void;
  onSelectShipment?: (ref: string) => void;
}

export default function AIAssistant({ shipments, orders, onSelectOrder, onSelectShipment }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: '¡Hola! Soy tu asistente logístico de LUFUSSA. Puedo ayudarte con información sobre tus importaciones, estados de pedidos, valores o darte recomendaciones. ¿En qué puedo ayudarte hoy?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      // El backend ahora carga todos los datos directamente de la BD
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', text: userMessage }]
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessages(prev => [...prev, { role: 'model', text: data.response }]);
      } else {
        throw new Error(data.message || 'Error al procesar la consulta');
      }
    } catch (error: any) {
      console.error("AI Assistant Error:", error);
      const errorMessage = error.message?.includes('no disponible') 
        ? 'El servicio de IA no está disponible. Por favor, contacta al administrador para configurar la API key de Gemini.'
        : 'Lo siento, hubo un error al procesar tu consulta. Por favor, intenta de nuevo más tarde.';
      
      setMessages(prev => [...prev, { role: 'model', text: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessageText = (text: string) => {
    // Regex to find [[PO:number]] or [[REF:reference]]
    const parts = text.split(/(\[\[(?:PO|REF):[^\]]+\]\])/g);
    
    return parts.map((part, i) => {
      const poMatch = part.match(/\[\[PO:([^\]]+)\]\]/);
      const refMatch = part.match(/\[\[REF:([^\]]+)\]\]/);
      
      if (poMatch) {
        const poNumber = poMatch[1];
        return (
          <button 
            key={i}
            onClick={() => onSelectOrder?.(poNumber)}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-lufussa-teal/10 text-lufussa-teal font-bold rounded border border-lufussa-teal/20 hover:bg-lufussa-teal/20 transition-colors mx-0.5"
          >
            PO {poNumber}
            <ExternalLink size={10} />
          </button>
        );
      }
      
      if (refMatch) {
        const ref = refMatch[1];
        return (
          <button 
            key={i}
            onClick={() => onSelectShipment?.(ref)}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-indigo-50 text-indigo-600 font-bold rounded border border-indigo-100 hover:bg-indigo-100 transition-colors mx-0.5"
          >
            REF {ref}
            <ExternalLink size={10} />
          </button>
        );
      }
      
      return <span key={i} className="inline"><ReactMarkdown>{part}</ReactMarkdown></span>;
    });
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 p-4 bg-lufussa-teal text-white rounded-full shadow-2xl hover:scale-110 transition-all z-50 flex items-center gap-2 group",
          isOpen && "scale-0 opacity-0"
        )}
      >
        <Bot size={24} />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 font-bold whitespace-nowrap">
          Asistente LUFUSSA
        </span>
      </button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? '60px' : '600px',
              width: isMinimized ? '300px' : '400px'
            }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-6 right-6 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-lufussa-teal text-white flex items-center justify-between cursor-pointer" onClick={() => isMinimized && setIsMinimized(false)}>
              <div className="flex items-center gap-2">
                <Bot size={20} />
                <span className="font-bold text-sm">Asistente Logístico</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }} className="p-1 hover:bg-white/20 rounded">
                  {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                </button>
                <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} className="p-1 hover:bg-white/20 rounded">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Messages */}
            {!isMinimized && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                  {messages.map((m, i) => (
                    <div key={i} className={cn("flex", m.role === 'user' ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "max-w-[80%] p-3 rounded-2xl text-sm shadow-sm",
                        m.role === 'user' 
                          ? "bg-lufussa-teal text-white rounded-tr-none" 
                          : "bg-white text-slate-700 border border-slate-100 rounded-tl-none"
                      )}>
                        <div className="flex items-center gap-2 mb-1 opacity-70">
                          {m.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                          <span className="text-[10px] font-bold uppercase tracking-wider">
                            {m.role === 'user' ? 'Tú' : 'Asistente'}
                          </span>
                        </div>
                        <div className="whitespace-pre-wrap">{renderMessageText(m.text)}</div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white p-3 rounded-2xl border border-slate-100 rounded-tl-none shadow-sm">
                        <Loader2 size={16} className="animate-spin text-lufussa-teal" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-slate-100 bg-white">
                  <form 
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Pregunta sobre un pedido, envío o estatus..."
                      className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-lufussa-teal/20 transition-all"
                    />
                    <button
                      type="submit"
                      disabled={!input.trim() || isLoading}
                      className="p-2 bg-lufussa-teal text-white rounded-xl disabled:opacity-50 hover:bg-opacity-90 transition-all"
                    >
                      <Send size={18} />
                    </button>
                  </form>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
