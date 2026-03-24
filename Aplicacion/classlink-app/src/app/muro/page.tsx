"use client";
import { useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import Modal from "@/components/ui/Modal";
import { FEED_POSTS, TALENT_PROFILES, PROFILES } from "@/lib/data";
import type { FeedPost } from "@/lib/types";
import { Heart, MessageCircle, Plus, Search, TrendingUp, Users, Flame, Award, ChevronRight } from "lucide-react";

const TABS = ["Todos", "Publicaciones", "Portafolios"] as const;
const TAG_FILTERS = ["Todos", "Soldadura TIG", "Ebanisteria", "Mecatronica", "Electricidad", "Evento"];

export default function MuroPage() {
  const [posts, setPosts] = useState<FeedPost[]>(FEED_POSTS);
  const [tab, setTab] = useState<string>("Todos");
  const [tagFilter, setTagFilter] = useState("Todos");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newTag, setNewTag] = useState("Mecatronica");

  const toggleLike = (id: string) => setPosts((prev) => prev.map((p) => p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p));

  const filtered = posts.filter((p) => {
    const matchTab = tab === "Todos" || (tab === "Publicaciones" && p.category === "publicacion") || (tab === "Portafolios" && p.category === "portafolio");
    const matchTag = tagFilter === "Todos" || p.tag === tagFilter;
    const matchSearch = search === "" || p.title.toLowerCase().includes(search.toLowerCase()) || p.author.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchTag && matchSearch;
  });

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    const post: FeedPost = {
      id: `p-${Date.now()}`, title: newTitle, description: newDesc, author: "Tu", authorAvatar: "", authorName: "Tu", authorRole: "Estudiante",
      content: newDesc,
      image: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&h=400&fit=crop",
      tag: newTag, likes: 0, liked: false, comments: 0, category: "publicacion", createdAt: new Date().toISOString().split("T")[0],
    };
    setPosts((prev) => [post, ...prev]);
    setNewTitle(""); setNewDesc(""); setModalOpen(false);
  };

  const trendingTags = [
    { name: "Mecatronica", posts: 24 },
    { name: "Soldadura TIG", posts: 18 },
    { name: "Electricidad", posts: 15 },
    { name: "Ebanisteria", posts: 11 },
    { name: "Evento", posts: 8 },
  ];

  return (
    <PageLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-cyan-600 font-semibold mb-1">Comunidad</p>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">El Muro</h1>
            <p className="text-sm text-slate-500 mt-1">Comparte proyectos, logros y conecta con la comunidad.</p>
          </div>
          <button onClick={() => setModalOpen(true)} className="flex items-center gap-1.5 bg-cyan-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-cyan-700 transition-colors shadow-sm">
            <Plus size={16} /> Publicar
          </button>
        </div>

        {/* Search + Tabs */}
        <div className="space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar publicaciones..." className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-cyan-200 outline-none" />
          </div>
          <div className="flex items-center gap-4 border-b border-slate-200">
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`pb-2.5 text-sm font-semibold transition-colors border-b-2 ${tab === t ? "border-cyan-500 text-cyan-700" : "border-transparent text-slate-400 hover:text-slate-600"}`}>{t}</button>
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {TAG_FILTERS.map((t) => (
              <button key={t} onClick={() => setTagFilter(t)} className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${tagFilter === t ? "bg-cyan-600 text-white" : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"}`}>{t}</button>
            ))}
          </div>
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Feed column */}
          <div className="lg:col-span-2 space-y-4">
            {filtered.map((post) => (
              <div key={post.id} className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden hover:shadow-sm transition-all">
                {post.image && (
                  <div className="aspect-[2.2/1] relative overflow-hidden">
                    <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
                    <div className="absolute top-3 right-3 flex gap-2">
                      <span className="bg-white/90 backdrop-blur px-2.5 py-1 rounded-full text-[10px] font-bold text-cyan-700">{post.tag}</span>
                    </div>
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-center gap-2.5 mb-3">
                    {post.authorAvatar ? (
                      <img src={post.authorAvatar} alt={post.authorName || post.author} className="w-9 h-9 rounded-xl object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">{(post.authorName || post.author).charAt(0)}</div>
                    )}
                    <div>
                      <span className="text-sm font-semibold">{post.authorName || post.author}</span>
                      {post.authorRole && <span className="text-[10px] text-slate-400 ml-2 bg-slate-100 px-1.5 py-0.5 rounded">{post.authorRole}</span>}
                      <p className="text-[10px] text-slate-400">{post.createdAt}</p>
                    </div>
                  </div>
                  <h3 className="font-bold text-lg mb-1.5">{post.title}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-4">{post.content || post.description}</p>
                  <div className="flex items-center gap-5 pt-3 border-t border-slate-100">
                    <button onClick={() => toggleLike(post.id)} className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${post.liked ? "text-red-500" : "text-slate-400 hover:text-red-400"}`}>
                      <Heart size={18} className={post.liked ? "fill-red-500" : ""} /> {post.likes}
                    </button>
                    <span className="flex items-center gap-1.5 text-sm text-slate-400 font-medium"><MessageCircle size={18} /> {post.comments}</span>
                  </div>
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="text-center py-20 bg-white rounded-2xl border border-slate-200/60">
                <Search size={48} className="mx-auto mb-4 text-slate-200" />
                <p className="text-slate-400 text-base font-medium">No se encontraron publicaciones.</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5 hidden lg:block">
            {/* Trending tags */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/60">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={16} className="text-cyan-500" />
                <span className="font-bold text-sm">Tendencias</span>
              </div>
              <div className="space-y-2.5">
                {trendingTags.map((tag, i) => (
                  <button key={tag.name} onClick={() => setTagFilter(tag.name)} className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left">
                    <span className="text-xs font-bold text-slate-300 w-5">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{tag.name}</p>
                      <p className="text-[10px] text-slate-400">{tag.posts} publicaciones</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Active users */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/60">
              <div className="flex items-center gap-2 mb-4">
                <Users size={16} className="text-violet-500" />
                <span className="font-bold text-sm">Miembros Activos</span>
              </div>
              <div className="space-y-2.5">
                {TALENT_PROFILES.slice(0, 5).map((t) => (
                  <div key={t.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                    <img src={t.avatar} alt={t.name} className="w-8 h-8 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{t.name}</p>
                      <p className="text-[10px] text-slate-400">{t.specialty}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Community stats */}
            <div className="bg-gradient-to-br from-cyan-500 to-teal-600 rounded-2xl p-5 text-white">
              <Flame size={24} className="mb-2 opacity-80" />
              <p className="text-2xl font-extrabold">{FEED_POSTS.length}</p>
              <p className="text-sm opacity-90 mt-1">Publicaciones</p>
              <p className="text-xs opacity-70 mt-0.5">+3 esta semana</p>
            </div>
          </div>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nueva Publicacion">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Titulo</label>
            <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Titulo del proyecto..." className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-cyan-200 outline-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Descripcion</label>
            <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} rows={3} placeholder="Describe tu proyecto..." className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-cyan-200 outline-none resize-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Categoria</label>
            <select value={newTag} onChange={(e) => setNewTag(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-cyan-200 outline-none">
              {TAG_FILTERS.filter((t) => t !== "Todos").map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <button onClick={handleCreate} disabled={!newTitle.trim()} className="w-full bg-cyan-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-cyan-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Publicar</button>
        </div>
      </Modal>
    </PageLayout>
  );
}
