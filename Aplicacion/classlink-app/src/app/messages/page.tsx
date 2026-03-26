"use client";
// ──────────────────────────────────────────────────────────
// Messages – Chat interface (route: /messages)
// ──────────────────────────────────────────────────────────
// A two-pane messenger layout:
//  Left pane  – Scrollable conversation list with search
//  Right pane – Active chat window with message bubbles
//
// Mobile behaviour:
//  - When no conversation is selected: only the left pane is shown
//  - When a conversation is selected:  only the right pane is shown
//  - A back arrow in the chat header returns to the list
//
// Desktop behaviour:
//  - Both panes are visible side-by-side at all times
//
// All data is from the mock data layer (no real-time connection).
// New messages are appended to local state only.
// ──────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from "react";
import PageLayout from "@/components/layout/PageLayout";
import { CONVERSATIONS, CHAT_MESSAGES } from "@/lib/data";
import type { Conversation, ChatMessage } from "@/lib/types";
import { ArrowLeft, MoreVertical, Send, Search, Circle } from "lucide-react";

export default function MessagesPage() {
  // ── State ─────────────────────────────────────────────
  const [conversations] = useState<Conversation[]>(CONVERSATIONS);
  // Currently open conversation (null = no conversation selected)
  const [activeConvo,   setActiveConvo] = useState<Conversation | null>(null);
  const [messages,      setMessages]    = useState<ChatMessage[]>(CHAT_MESSAGES);
  const [input,         setInput]       = useState("");
  const [search,        setSearch]      = useState("");

  // Ref for the message list container — used to auto-scroll on new messages
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /** Filter conversations by the search input */
  const filtered = conversations.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  /** Messages that belong to the currently active conversation */
  const convoMessages = activeConvo
    ? messages.filter((m) => m.conversationId === activeConvo.id)
    : [];

  /** Scroll the message list to the bottom whenever new messages arrive */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [convoMessages.length]);

  /**
   * Append a new "sent" message to the conversation.
   * In a real app this would call an API or push to a WebSocket.
   */
  const send = () => {
    if (!input.trim() || !activeConvo) return;
    const msg: ChatMessage = {
      id:             `m-${Date.now()}`,
      conversationId: activeConvo.id,
      sender:         "me",
      text:           input,
      time:           new Date().toLocaleTimeString("es-CR", {
        hour:   "2-digit",
        minute: "2-digit",
      }),
    };
    setMessages((prev) => [...prev, msg]);
    setInput("");
  };

  // ── Render ────────────────────────────────────────────
  return (
    <PageLayout>
      {/* Full-height flex row that fills the space below the top nav */}
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden">

        {/* ═════ Left pane – Conversation list ═════ */}
        {/* Hidden on mobile when a conversation is active */}
        <div
          className={`
            w-full md:w-80 lg:w-96 bg-white border-r border-slate-200/60
            flex flex-col shrink-0
            ${activeConvo ? "hidden md:flex" : "flex"}
          `}
        >
          {/* Pane header + search */}
          <div className="p-4 border-b border-slate-100 shrink-0">
            <h2 className="text-lg font-bold mb-3">Mensajes</h2>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar conversación..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-cyan-200 outline-none"
              />
            </div>
          </div>

          {/* Conversation items — scrollable */}
          <div className="flex-1 overflow-y-auto thin-scrollbar divide-y divide-slate-100">
            {filtered.map((c, i) => (
              <button
                key={c.id}
                onClick={() => setActiveConvo(c)}
                className={`
                  w-full flex items-center gap-3 p-4
                  hover:bg-slate-50/80 transition-colors text-left
                  animate-fade-in-up stagger-${Math.min(i + 1, 6)}
                  ${activeConvo?.id === c.id ? "bg-cyan-50/60" : ""}
                `}
              >
                {/* Avatar with online indicator dot */}
                <div className="relative shrink-0">
                  <img
                    src={c.avatar}
                    alt={c.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  {/* Green dot for online participants */}
                  {c.online && (
                    <Circle
                      size={10}
                      className="absolute bottom-0 right-0 fill-green-500 text-white animate-pulse-dot"
                    />
                  )}
                </div>

                {/* Conversation preview */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-semibold truncate">{c.name}</p>
                    <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                      {c.lastTime}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate">{c.lastMessage}</p>
                </div>

                {/* Unread count badge */}
                {c.unread > 0 && (
                  <span className="ml-2 bg-cyan-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 animate-pop-in">
                    {c.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ═════ Right pane – Chat window ═════ */}
        {/* Hidden on mobile when no conversation is selected */}
        <div
          className={`
            flex-1 flex flex-col bg-slate-50/80
            ${!activeConvo ? "hidden md:flex" : "flex"}
          `}
        >
          {activeConvo ? (
            <>
              {/* Chat header */}
              <div className="bg-white border-b border-slate-200/60 px-4 py-3 flex items-center gap-3 shrink-0">
                {/* Back button (mobile only) */}
                <button
                  onClick={() => setActiveConvo(null)}
                  className="md:hidden text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <ArrowLeft size={20} />
                </button>

                <img
                  src={activeConvo.avatar}
                  alt={activeConvo.name}
                  className="w-9 h-9 rounded-full object-cover"
                />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{activeConvo.name}</p>
                  {/* Online / offline status indicator */}
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        activeConvo.online ? "bg-green-500 animate-pulse-dot" : "bg-slate-300"
                      }`}
                    />
                    <p className="text-[11px] text-slate-400">
                      {activeConvo.online ? "En línea" : "Desconectado"}
                    </p>
                  </div>
                </div>

                {/* Options button (placeholder — no actions in prototype) */}
                <button className="text-slate-400 hover:text-slate-600 transition-colors">
                  <MoreVertical size={18} />
                </button>
              </div>

              {/* Message bubbles — scrollable */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 thin-scrollbar">
                {convoMessages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.sender === "me" ? "justify-end" : "justify-start"} animate-fade-in-up`}
                  >
                    <div
                      className={`
                        max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm
                        ${m.sender === "me"
                          ? "bg-cyan-600 text-white rounded-br-sm shadow-sm"
                          : "bg-white border border-slate-200/80 text-slate-700 rounded-bl-sm shadow-sm"
                        }
                      `}
                    >
                      {m.text}
                      {/* Message timestamp */}
                      <p
                        className={`text-[10px] mt-1 ${
                          m.sender === "me" ? "text-cyan-200" : "text-slate-400"
                        }`}
                      >
                        {m.time}
                      </p>
                    </div>
                  </div>
                ))}
                {/* Invisible element scrolled into view on new message */}
                <div ref={messagesEndRef} />
              </div>

              {/* Message input bar */}
              <div className="bg-white border-t border-slate-200/60 px-4 py-3 flex items-center gap-2 shrink-0">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  // Send on Enter key (Shift+Enter would insert a newline in a textarea)
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2.5 text-sm focus:ring-2 focus:ring-cyan-200 outline-none"
                />
                <button
                  onClick={send}
                  disabled={!input.trim()}
                  className="bg-cyan-600 text-white p-2.5 rounded-full hover:bg-cyan-700 active:bg-cyan-800 disabled:opacity-40 transition-colors btn-press"
                >
                  <Send size={16} />
                </button>
              </div>
            </>
          ) : (
            // Empty state shown on desktop when no conversation is selected
            <div className="flex-1 flex items-center justify-center animate-fade-in">
              <div className="text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Search size={24} className="text-slate-300" />
                </div>
                <p className="text-slate-400 text-sm font-medium">
                  Selecciona una conversación
                </p>
                <p className="text-xs text-slate-300 mt-1">
                  Elige un chat de la lista para empezar
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
