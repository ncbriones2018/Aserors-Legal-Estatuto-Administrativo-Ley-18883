import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send } from 'lucide-react';
import { chatWithGemini } from './services/geminiService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Bienvenido/a al **Asesor Virtual de la Ley 18.883**.

Estoy aquí para orientarle sobre el **Estatuto Administrativo para Funcionarios Municipales**, incluyendo:

- Carrera funcionaria — ingreso, plantas, contratas, ascensos
- Derechos y obligaciones — feriados, permisos, licencias
- Procedimientos disciplinarios — sumarios, investigaciones
- Cesación de funciones — renuncia, destitución, jubilación

¿En qué puedo ayudarle hoy?`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickButtons, setShowQuickButtons] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (text?: string) => {
    const query = text || input.trim();
    if (!query || isLoading) return;

    if (showQuickButtons) setShowQuickButtons(false);

    const newMessages: Message[] = [...messages, { role: 'user', content: query }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatWithGemini(newMessages);
      setMessages([...newMessages, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error(error);
      setMessages([...newMessages, { role: 'assistant', content: '⚠ Error al conectar con el servicio. Verifique su conexión e intente nuevamente.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickQueries = [
    '¿Cuántos días de permiso administrativo con goce de remuneraciones tiene un funcionario municipal al año?',
    '¿Cómo se inicia un sumario administrativo y cuáles son sus etapas?',
    '¿Cuáles son las causales de cesación de funciones en la Ley 18.883?',
    '¿Qué dice el artículo 82 sobre prohibiciones de los funcionarios municipales?'
  ];

  const processContent = (text: string) => {
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    formatted = formatted.replace(/(Art(?:ículo)?\.?\s*\d+[°º]?[\w\s]*)/g, '<span class="art-ref">$1</span>');
    formatted = formatted.replace(/CGR[^<\n]*/g, m => `<div class="cgr-note">⚠ ${m}</div>`);
    
    const lines = formatted.split('\n');
    let html = '';
    let inList = false;
    
    for (const line of lines) {
      const t = line.trim();
      if (t.startsWith('- ') || t.startsWith('• ')) {
        if (!inList) {
          html += '<ul class="list-none pl-4 my-2">';
          inList = true;
        }
        html += `<li class="relative pl-3.5 my-1 text-text-mid before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-gold">${t.slice(2)}</li>`;
      } else {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        if (t) {
          html += `<p class="my-1.5">${t}</p>`;
        }
      }
    }
    
    if (inList) {
      html += '</ul>';
    }
    
    return html;
  };

  return (
    <div className="app relative z-10 w-full max-w-[820px] h-[calc(100vh-40px)] max-h-[900px] flex flex-col bg-cream rounded-[20px] overflow-hidden shadow-[var(--shadow-lg)] border border-gold/15 animate-[appReveal_0.6s_cubic-bezier(0.16,1,0.3,1)_both]">
      
      {/* HEADER */}
      <header className="bg-linear-to-br from-navy to-navy-mid p-5 md:px-7 flex items-center gap-4 border-b border-gold/20 shrink-0 relative overflow-hidden">
        <div className="absolute -top-[30px] -right-[30px] w-[120px] h-[120px] rounded-full bg-radial-gradient(circle,rgba(200,169,110,0.08)_0%,transparent_70%)" />
        <div className="w-[52px] h-[52px] bg-linear-to-br from-gold to-[#a8873e] rounded-xl flex items-center justify-center text-2xl shrink-0 shadow-[0_4px_16px_rgba(200,169,110,0.3)] relative">
          ⚖
        </div>
        <div className="flex-1">
          <h1 className="font-serif text-[17px] font-bold text-white tracking-tight leading-tight">
            Asesor Virtual — Ley 18.883
          </h1>
          <p className="text-[11.5px] text-white/50 mt-0.5 font-light tracking-wider">
            Estatuto Administrativo para Funcionarios Municipales · Chile
          </p>
          <div className="flex gap-1.5 mt-2">
            <span className="text-[10px] font-semibold tracking-widest uppercase px-2.5 py-1 rounded-full bg-gold/15 text-gold-light border border-gold/25">
              IA Legal
            </span>
            <span className="text-[10px] font-semibold tracking-widest uppercase px-2.5 py-1 rounded-full bg-green-500/10 text-[#6de08a] border border-green-500/20 flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34c759] mr-1.5 animate-[pulse_2s_ease_infinite]" />
              En línea
            </span>
            <span className="text-[10px] font-semibold tracking-widest uppercase px-2.5 py-1 rounded-full bg-gold/15 text-gold-light border border-gold/25">
              CGR
            </span>
          </div>
        </div>
      </header>

      {/* CHAT AREA */}
      <div id="chat" className="flex-1 overflow-y-auto p-6 md:px-7 flex flex-col gap-4 bg-cream scroll-smooth">
        <div className="flex items-center gap-2.5 my-1 before:content-[''] before:flex-1 before:h-[1px] before:bg-linear-to-r before:from-transparent before:to-gold/20 after:content-[''] after:flex-1 after:h-[1px] after:bg-linear-to-r after:from-gold/20 after:to-transparent">
          <span className="text-[10.5px] text-text-light whitespace-nowrap tracking-widest">Hoy</span>
        </div>

        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex gap-3 max-w-[88%] md:max-w-[85%]",
                msg.role === 'user' ? "self-end flex-row-reverse" : "self-start"
              )}
            >
              <div className={cn(
                "w-[34px] h-[34px] rounded-lg flex items-center justify-center shrink-0 mt-0.5 shadow-md",
                msg.role === 'assistant' 
                  ? "bg-linear-to-br from-navy to-navy-light text-gold text-base" 
                  : "bg-linear-to-br from-gold to-[#a8873e] text-white text-[11px] font-bold tracking-tight"
              )}>
                {msg.role === 'assistant' ? '⚖' : 'TÚ'}
              </div>
              <div className={cn(
                "bubble p-[13px_17px] rounded-2xl text-[13.5px] leading-relaxed max-w-full shadow-sm",
                msg.role === 'assistant'
                  ? "bg-white text-text-dark border border-navy/5 rounded-tl-none"
                  : "bg-linear-to-br from-navy-light to-navy text-white rounded-tr-none shadow-[0_4px_16px_rgba(13,31,53,0.2)]"
              )}>
                <div className="markdown-body">
                  {/* We use dangerouslySetInnerHTML because we are injecting spans/divs via regex */}
                  {/* In a real app we'd use a more robust parser, but for this demo it matches user intent */}
                  <div dangerouslySetInnerHTML={{ __html: processContent(msg.content) }} />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 self-start"
          >
            <div className="w-[34px] h-[34px] rounded-lg flex items-center justify-center shrink-0 mt-0.5 shadow-md bg-linear-to-br from-navy to-navy-light text-gold text-base">
              ⚖
            </div>
            <div className="flex items-center gap-1.5 p-[14px_18px] bg-white border border-navy/5 rounded-2xl rounded-tl-none shadow-sm">
              <span className="text-[11px] text-text-light italic mr-1">Analizando</span>
              <div className="w-1.5 h-1.5 bg-gold rounded-full animate-[typingBounce_1.2s_infinite] opacity-40" />
              <div className="w-1.5 h-1.5 bg-gold rounded-full animate-[typingBounce_1.2s_infinite_0.15s] opacity-40" />
              <div className="w-1.5 h-1.5 bg-gold rounded-full animate-[typingBounce_1.2s_infinite_0.3s] opacity-40" />
            </div>
          </motion.div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* QUICK BUTTONS */}
      {showQuickButtons && (
        <motion.div 
          initial={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0, padding: 0 }}
          className="px-7 pb-3.5 bg-cream shrink-0 overflow-hidden"
        >
          <div className="text-[10.5px] font-semibold tracking-widest uppercase text-text-light mb-2">
            Consultas frecuentes
          </div>
          <div className="flex flex-wrap gap-2">
            {quickQueries.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSend(q)}
                className="bg-white border border-gold/30 text-text-mid text-xs font-medium px-3.5 py-2 rounded-full cursor-pointer transition-all hover:bg-gold-pale hover:border-gold hover:text-navy hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
              >
                {q.split('?')[0].replace('¿', '').trim().slice(0, 30)}...
              </button>
            ))}
          </div>
        </motion.div>
      )}

      <div className="h-[1px] bg-linear-to-r from-transparent via-gold/20 to-transparent shrink-0" />

      {/* FOOTER INPUT */}
      <footer className="p-3.5 md:px-5 bg-white flex gap-2.5 items-center shrink-0">
        <div className="flex-1 flex items-center bg-cream border border-gold/30 rounded-3xl px-4 transition-all focus-within:border-gold focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(200,169,110,0.1)] gap-2">
          <span className="text-text-light text-sm shrink-0">✍</span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Escriba su consulta sobre la Ley 18.883..."
            className="flex-1 border-none bg-transparent py-2.5 text-[13.5px] text-text-dark outline-hidden placeholder:text-text-light"
          />
        </div>
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || isLoading}
          className="w-[42px] h-[42px] rounded-xl bg-linear-to-br from-navy-light to-navy border-none text-gold flex items-center justify-center transition-all shadow-[0_4px_12px_rgba(13,31,53,0.25)] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(13,31,53,0.3)] active:translate-y-0 disabled:opacity-50 disabled:cursor-default disabled:transform-none"
        >
          <Send size={18} strokeWidth={2.2} />
        </button>
      </footer>
      <div className="text-[10px] text-text-light text-center px-5 pb-2.5 bg-white tracking-tight">
        Las respuestas son orientativas y no constituyen asesoría legal formal.
      </div>
    </div>
  );
}
