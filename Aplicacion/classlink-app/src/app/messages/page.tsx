"use client";
import { useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import { CONVERSATIONS, CHAT_MESSAGES } from "@/lib/data";
import type { Conversation, ChatMessage } from "@/lib/types";
import { ArrowLeft, MoreVertical, Send, Search, Circle } from "lucide-react";

export default function MessagesPage() {
  const [conversations] = useState<Conversation[]>(CONVERSATIONS);
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(CHAT_MESSAGES);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");

  const filtered = conversations.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  const send = () => {
    if (!input.trim() || !activeConvo) return;
    const msg: ChatMessage = { id: `m-${Date.now()}`, conversationId: activeConvo.id, sender: "me", text: input, time: new Date().toLocaleTimeString("es-CR", { hour: "2-digit", minute: "2-digit" }) };
    setMessages((prev) => [...prev, msg]);
    setInput("");
  };

  const convoMessages = activeConvo ? messages.filter((m) => m.conversationId === activeConvo.id) : [];

  return (
    <PageLayout>
      <div className="flex h-[calc(100vh-4rem)] lg:h-screen overflow-hidden">
        {/* Sidebar */}
        <div className={`w-full md:w-80 lg:w-96 bg-white border-r border-slate-200 flex flex-col shrink-0 ${activeConvo ? "hidden md:flex" : "flex"}`}>
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-lg font-bold mb-3">Mensajes</h2>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar conversación..." className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-cyan-200 outline-none" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filtered.map((c) => (
              <button key={c.id} onClick={() => setActiveConvo(c)} className={`w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors text-left ${activeConvo?.id === c.id ? "bg-cyan-50/60" : ""}`}>
                <div className="relative shrink-0">
                  <img src={c.avatar} alt={c.name} className="w-10 h-10 rounded-full object-cover" />
                  {c.online && <Circle size={10} className="absolute bottom-0 right-0 fill-green-500 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-semibold truncate">{c.name}</p>
                    <span className="text-[10px] text-slate-400 shrink-0 ml-2">{c.lastTime}</span>
                  </div>
                  <p className="text-xs text-slate-400 truncate">{c.lastMessage}</p>
                </div>
                {c.unread > 0 && <span className="ml-2 bg-cyan-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0">{c.unread}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col bg-slate-50 ${!activeConvo ? "hidden md:flex" : "flex"}`}>
          {activeConvo ? (
            <>
              <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
                <button onClick={() => setActiveConvo(null)} className="md:hidden text-slate-400 hover:text-slate-600"><ArrowLeft size={20} /></button>
                <img src={activeConvo.avatar} alt={activeConvo.name} className="w-9 h-9 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{activeConvo.name}</p>
                  <p className="text-[11px] text-slate-400">{activeConvo.online ? "En línea" : "Desconectado"}</p>
                </div>
                <button className="text-slate-400 hover:text-slate-600"><MoreVertical size={18} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {convoMessages.map((m) => (
                  <div key={m.id} className={`flex ${m.sender === "me" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm ${m.sender === "me" ? "bg-cyan-600 text-white rounded-br-md" : "bg-white border border-slate-200 text-slate-700 rounded-bl-md"}`}>
                      {m.text}
                      <p className={`text-[10px] mt-1 ${m.sender === "me" ? "text-cyan-200" : "text-slate-400"}`}>{m.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-white border-t border-slate-200 px-4 py-3 flex items-center gap-2">
                <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Escribe un mensaje..." className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2.5 text-sm focus:ring-2 focus:ring-cyan-200 outline-none" />
                <button onClick={send} disabled={!input.trim()} className="bg-cyan-600 text-white p-2.5 rounded-full hover:bg-cyan-700 disabled:opacity-40 transition-colors"><Send size={16} /></button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3"><Search size={24} className="text-slate-300" /></div>
                <p className="text-slate-400 text-sm font-medium">Selecciona una conversación</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
