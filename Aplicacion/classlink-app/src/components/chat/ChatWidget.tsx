"use client";
// ──────────────────────────────────────────────────────────────────
// ChatWidget — floating AI assistant (Empresa + Colegio only)
// Epic 3: Context-Aware Agentic Chatbot
// ──────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageSquare, X, Send, Loader2, Bot, Sparkles, ChevronDown,
} from "lucide-react";
import { useRole } from "@/lib/role-context";

// ── Types ─────────────────────────────────────────────────────────

interface ChatMessage {
  id:       string;
  role:     "user" | "assistant";
  content:  string;
  pending?: boolean;
  tool?:    string;
}

// ── Component ─────────────────────────────────────────────────────

export default function ChatWidget() {
  const { role } = useRole();
  const [open, setOpen]         = useState(false);
  const [input, setInput]       = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  // All hooks MUST be called before any conditional return
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, streaming]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80);
  }, [open]);

  const clearHistory = useCallback(() => setMessages([]), []);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", content: text };
    const placeholderId = `a-${Date.now()}`;
    const placeholder: ChatMessage = { id: placeholderId, role: "assistant", content: "", pending: true };

    setMessages((prev) => [...prev, userMsg, placeholder]);
    setStreaming(true);

    const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch("/api/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ messages: history }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assembled = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") break;
          try {
            const parsed = JSON.parse(payload);
            if (parsed.type === "text") {
              assembled += parsed.text;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === placeholderId ? { ...m, content: assembled, pending: false, tool: undefined } : m
                )
              );
            } else if (parsed.type === "tool_call") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === placeholderId ? { ...m, tool: parsed.tool } : m
                )
              );
            } else if (parsed.type === "error") {
              assembled = `Lo siento, ocurrió un error: ${parsed.message}`;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === placeholderId ? { ...m, content: assembled, pending: false, tool: undefined } : m
                )
              );
            }
          } catch { /* malformed JSON — skip */ }
        }
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === placeholderId ? { ...m, content: assembled || "…", pending: false, tool: undefined } : m
        )
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido.";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === placeholderId ? { ...m, content: `Error: ${msg}`, pending: false } : m
        )
      );
    } finally {
      setStreaming(false);
    }
  }, [input, messages, streaming]);

  // Only render for Empresa and Colegio, and only when the feature is enabled.
  // ENABLE_AI_CHAT must be "true" in .env.local — see /api/chat/route.ts.
  if (role !== "Empresa" && role !== "Colegio") return null;
  if (process.env.NEXT_PUBLIC_ENABLE_AI_CHAT !== "true") return null;

  const roleName  = role === "Empresa" ? "Empresa" : "Colegio";
  const accentCls = role === "Empresa" ? "bg-violet-600" : "bg-cyan-600";
  const hoverCls  = role === "Empresa" ? "hover:bg-violet-700" : "hover:bg-cyan-700";
  const bubbleCls = role === "Empresa" ? "bg-violet-600 text-white" : "bg-cyan-600 text-white";

  // ── Render ────────────────────────────────────────────────────

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Abrir asistente IA"
        className={`fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 p-3.5 rounded-full shadow-lg ${accentCls} ${hoverCls} text-white transition-all hover:scale-105 active:scale-95 flex items-center justify-center`}
      >
        {open ? <X size={20} /> : <MessageSquare size={20} />}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-36 right-4 md:bottom-20 md:right-6 z-40 w-[calc(100vw-2rem)] max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
          style={{ height: "520px" }}
        >
          {/* Header */}
          <div className={`${accentCls} px-4 py-3 flex items-center gap-2.5 shrink-0`}>
            <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center">
              <Bot size={15} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white leading-tight">Asistente ClassLink</p>
              <p className="text-[10px] text-white/70">{roleName} · IA con herramientas</p>
            </div>
            <div className="flex items-center gap-1.5">
              {messages.length > 0 && (
                <button onClick={clearHistory} className="text-white/60 hover:text-white text-[10px] underline">
                  Limpiar
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white">
                <ChevronDown size={18} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 thin-scrollbar">
            {messages.length === 0 && (
              <div className="text-center py-8 space-y-2">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                  <Sparkles size={18} className="text-slate-400" />
                </div>
                <p className="text-xs text-slate-500 font-medium">¿En qué puedo ayudarte?</p>
                <p className="text-[11px] text-slate-400 px-4">
                  {role === "Empresa"
                    ? "Pregúntame sobre tus vacantes, postulantes o estadísticas de reclutamiento."
                    : "Pregúntame sobre tus estudiantes, solicitudes de prácticas o datos del colegio."}
                </p>
              </div>
            )}

            {messages.map((m) => {
              const isUser = m.role === "user";
              return (
                <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                  {!isUser && (
                    <div className={`w-6 h-6 rounded-full ${accentCls} flex items-center justify-center shrink-0 mr-2 mt-0.5`}>
                      <Bot size={11} className="text-white" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm ${
                    isUser ? `${bubbleCls} rounded-br-sm` : "bg-slate-100 text-slate-700 rounded-bl-sm"
                  }`}>
                    {m.pending && m.tool && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1.5">
                        <Loader2 size={10} className="animate-spin" />
                        Consultando {m.tool}…
                      </div>
                    )}
                    {m.pending && !m.tool && !m.content && (
                      <div className="flex gap-1 items-center py-0.5">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    )}
                    {m.content && <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-slate-100 flex items-center gap-2 shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Escribe tu pregunta…"
              disabled={streaming}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-cyan-200 outline-none disabled:opacity-50"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || streaming}
              className={`${accentCls} ${hoverCls} text-white p-2.5 rounded-full disabled:opacity-40 transition-colors shrink-0`}
            >
              {streaming ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
