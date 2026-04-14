"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import PageLayout from "@/components/layout/PageLayout";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { ArrowLeft, Send, Search, Circle, Loader2, Trash2, MoreVertical } from "lucide-react";

interface Participant {
  id: string;
  name: string;
  avatar: string;
  role: string;
}

interface ConversationRow {
  id: string;
  user1_id: string;
  user2_id: string;
  last_message_at: string;
  other: Participant;
  lastPreview: string;
  unread: number;
}

interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [convos, setConvos] = useState<ConversationRow[]>([]);
  const [activeConvo, setActiveConvo] = useState<ConversationRow | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!user?.id) return;
    setLoadingConvos(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("conversations")
        .select(`
          id, user1_id, user2_id, last_message_at,
          user1:profiles!conversations_user1_id_fkey(id, name, avatar, role),
          user2:profiles!conversations_user2_id_fkey(id, name, avatar, role)
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order("last_message_at", { ascending: false });

      if (err) throw err;

      const rows: ConversationRow[] = (data ?? []).map((c: any) => {
        const other: Participant = c.user1_id === user.id ? c.user2 : c.user1;
        return {
          id: c.id,
          user1_id: c.user1_id,
          user2_id: c.user2_id,
          last_message_at: c.last_message_at,
          other: other ?? { id: "", name: "Usuario", avatar: "", role: "" },
          lastPreview: "",
          unread: 0,
        };
      });
      setConvos(rows);
    } catch {
      setError("No se pudieron cargar las conversaciones.");
    } finally {
      setLoadingConvos(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  // Fetch messages for active conversation
  const fetchMessages = useCallback(async (convoId: string) => {
    setLoadingMsgs(true);
    const { data, error: err } = await supabase
      .from("messages")
      .select("id, conversation_id, sender_id, content, read, created_at")
      .eq("conversation_id", convoId)
      .order("created_at", { ascending: true })
      .limit(100);

    if (!err && data) {
      setMessages(data as MessageRow[]);
      // Mark unread messages as read
      const unreadIds = (data as MessageRow[])
        .filter((m) => !m.read && m.sender_id !== user?.id)
        .map((m) => m.id);
      if (unreadIds.length > 0) {
        await supabase.from("messages").update({ read: true }).in("id", unreadIds);
      }
    }
    setLoadingMsgs(false);
  }, [user?.id]);

  useEffect(() => {
    if (!activeConvo) return;
    fetchMessages(activeConvo.id);

    // Realtime subscription
    const channel = supabase
      .channel(`messages:${activeConvo.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${activeConvo.id}`,
      }, (payload) => {
        const incoming = payload.new as MessageRow;
        setMessages((prev) => {
          // Skip if we already have this message (optimistic or prior fetch)
          if (prev.some((m) => m.id === incoming.id)) return prev;
          return [...prev, incoming];
        });
        // Mark as read if from other person
        if ((payload.new as MessageRow).sender_id !== user?.id) {
          supabase.from("messages").update({ read: true }).eq("id", (payload.new as MessageRow).id);
        }
      })
      .on("postgres_changes", {
        event: "DELETE",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${activeConvo.id}`,
      }, (payload) => {
        setMessages((prev) => prev.filter((m) => m.id !== (payload.old as MessageRow).id));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConvo?.id, fetchMessages, user?.id]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const send = async () => {
    if (!input.trim() || !activeConvo || !user) return;
    setSending(true);
    const text = input.trim();
    setInput("");

    // Optimistic update — message appears immediately
    const optimisticId = `opt-${Date.now()}`;
    const optimistic: MessageRow = {
      id:              optimisticId,
      conversation_id: activeConvo.id,
      sender_id:       user.id,
      content:         text,
      read:            false,
      created_at:      new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    const { data, error: err } = await supabase
      .from("messages")
      .insert({ conversation_id: activeConvo.id, sender_id: user.id, content: text, read: false })
      .select("id, conversation_id, sender_id, content, read, created_at")
      .single();

    if (err) {
      setError("No se pudo enviar el mensaje.");
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setInput(text);
    } else if (data) {
      // Replace optimistic entry with the real DB record
      setMessages((prev) => prev.map((m) => (m.id === optimisticId ? (data as MessageRow) : m)));
    }
    setSending(false);
  };

  const deleteMessage = async (msgId: string) => {
    await supabase.from("messages").delete().eq("id", msgId).eq("sender_id", user?.id ?? "");
  };

  const filtered = convos.filter((c) =>
    c.other.name.toLowerCase().includes(search.toLowerCase())
  );

  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString("es-CR", { hour: "2-digit", minute: "2-digit" });

  return (
    <PageLayout>
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
        {/* Left pane */}
        <div className={`w-full md:w-80 lg:w-96 bg-white border-r border-slate-200/60 flex flex-col shrink-0 ${activeConvo ? "hidden md:flex" : "flex"}`}>
          <div className="p-4 border-b border-slate-100 shrink-0">
            <h2 className="text-lg font-bold mb-3">Mensajes</h2>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text" value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar conversación..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-cyan-200 outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto thin-scrollbar divide-y divide-slate-100">
            {loadingConvos && (
              <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-cyan-400" /></div>
            )}
            {!loadingConvos && filtered.length === 0 && (
              <div className="text-center py-10 text-sm text-slate-400">No hay conversaciones aún.</div>
            )}
            {filtered.map((c) => (
              <button key={c.id} onClick={() => setActiveConvo(c)}
                className={`w-full flex items-center gap-3 p-4 hover:bg-slate-50/80 transition-colors text-left ${activeConvo?.id === c.id ? "bg-cyan-50/60" : ""}`}
              >
                <div className="relative shrink-0">
                  {c.other.avatar ? (
                    <img src={c.other.avatar} alt={c.other.name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center text-sm font-bold text-cyan-700">
                      {c.other.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{c.other.name}</p>
                  <p className="text-xs text-slate-400 truncate">{c.other.role}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right pane */}
        <div className={`flex-1 flex flex-col bg-slate-50/80 ${!activeConvo ? "hidden md:flex" : "flex"}`}>
          {activeConvo ? (
            <>
              <div className="bg-white border-b border-slate-200/60 px-4 py-3 flex items-center gap-3 shrink-0">
                <button onClick={() => setActiveConvo(null)} className="md:hidden text-slate-400 hover:text-slate-600">
                  <ArrowLeft size={20} />
                </button>
                {activeConvo.other.avatar ? (
                  <img src={activeConvo.other.avatar} alt={activeConvo.other.name} className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-cyan-100 flex items-center justify-center text-sm font-bold text-cyan-700">
                    {activeConvo.other.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{activeConvo.other.name}</p>
                  <p className="text-[11px] text-slate-400">{activeConvo.other.role}</p>
                </div>
                <button className="text-slate-400 hover:text-slate-600"><MoreVertical size={18} /></button>
              </div>

              {error && (
                <div className="px-4 py-2 bg-red-50 border-b border-red-200 text-sm text-red-600">{error}</div>
              )}

              <div className="flex-1 overflow-y-auto p-4 space-y-3 thin-scrollbar">
                {loadingMsgs && <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-cyan-400" /></div>}
                {!loadingMsgs && messages.length === 0 && (
                  <div className="text-center py-10 text-sm text-slate-400">No hay mensajes aún. ¡Envía el primero!</div>
                )}
                {messages.map((m) => {
                  const isMe = m.sender_id === user?.id;
                  return (
                    <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"} group`}>
                      <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm relative ${isMe ? "bg-cyan-600 text-white rounded-br-sm shadow-sm" : "bg-white border border-slate-200/80 text-slate-700 rounded-bl-sm shadow-sm"}`}>
                        {m.content}
                        <p className={`text-[10px] mt-1 ${isMe ? "text-cyan-200" : "text-slate-400"}`}>{fmt(m.created_at)}</p>
                        {isMe && (
                          <button
                            onClick={() => deleteMessage(m.id)}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full hidden group-hover:flex items-center justify-center hover:bg-red-600 transition-colors"
                          >
                            <Trash2 size={10} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="bg-white border-t border-slate-200/60 px-4 py-3 flex items-center gap-2 shrink-0">
                <input
                  type="text" value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2.5 text-sm focus:ring-2 focus:ring-cyan-200 outline-none"
                />
                <button onClick={send} disabled={!input.trim() || sending}
                  className="bg-cyan-600 text-white p-2.5 rounded-full hover:bg-cyan-700 active:bg-cyan-800 disabled:opacity-40 transition-colors btn-press"
                >
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Search size={24} className="text-slate-300" />
                </div>
                <p className="text-slate-400 text-sm font-medium">Selecciona una conversación</p>
                <p className="text-xs text-slate-300 mt-1">Elige un chat de la lista para empezar</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
