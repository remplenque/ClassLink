"use client";
// ──────────────────────────────────────────────────────────
// El Muro – Community feed (Supabase-backed)
// ──────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import PageLayout from "@/components/layout/PageLayout";
import Modal      from "@/components/ui/Modal";
import { supabase } from "@/lib/supabase";
import { useAuth }  from "@/lib/auth-context";
import { TALENT_PROFILES } from "@/lib/data";
import type { FeedPost } from "@/lib/types";
import {
  Heart, MessageCircle, Plus, Search, TrendingUp, Users, Flame, Loader2,
} from "lucide-react";
import { postSchema } from "@/lib/schemas";
import DOMPurify from "isomorphic-dompurify";

// ── Constants ─────────────────────────────────────────────

const TABS = ["Todos", "Publicaciones", "Portafolios"] as const;

const TAG_FILTERS = [
  "Todos", "Soldadura TIG", "Ebanistería", "Mecatrónica", "Electricidad", "Evento",
];

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&h=400&fit=crop";

// ── Component ─────────────────────────────────────────────

export default function MuroPage() {
  const { user } = useAuth();

  const [posts,      setPosts]      = useState<FeedPost[]>([]);
  const [tab,        setTab]        = useState<string>("Todos");
  const [tagFilter,  setTagFilter]  = useState("Todos");
  const [search,     setSearch]     = useState("");
  const [modalOpen,  setModalOpen]  = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isPosting,  setIsPosting]  = useState(false);

  // New post form fields
  const [newTitle,    setNewTitle]    = useState("");
  const [newDesc,     setNewDesc]     = useState("");
  const [newTag,      setNewTag]      = useState("Mecatrónica");
  const [newCategory, setNewCategory] = useState<"publicacion" | "portafolio">("publicacion");

  // ── Fetch posts from Supabase ──────────────────────────

  const fetchPosts = useCallback(async () => {
    setIsFetching(true);

    const { data, error } = await supabase
      .from("posts")
      .select(`
        id, title, description, content, image, tag,
        likes_count, comments_count, category, created_at, author_id,
        profiles!author_id (name, avatar, role)
      `)
      .order("created_at", { ascending: false });

    if (error || !data) {
      setIsFetching(false);
      return;
    }

    // Fetch which posts the current user has liked
    let likedIds = new Set<string>();
    if (user?.id) {
      const { data: likes } = await supabase
        .from("post_likes")
        .select("post_id")
        .eq("user_id", user.id);
      likedIds = new Set((likes ?? []).map((l: { post_id: string }) => l.post_id));
    }

    const mapped: FeedPost[] = (data as any[]).map((p) => ({
      id:           p.id,
      title:        p.title,
      description:  p.description ?? "",
      content:      p.content ?? "",
      author:       p.author_id ?? "",
      authorName:   p.profiles?.name  ?? "Usuario",
      authorAvatar: p.profiles?.avatar ?? "",
      authorRole:   p.profiles?.role   ?? "Estudiante",
      image:        p.image ?? "",
      tag:          p.tag   ?? "",
      likes:        p.likes_count    ?? 0,
      liked:        likedIds.has(p.id),
      comments:     p.comments_count ?? 0,
      category:     p.category as "publicacion" | "portafolio",
      createdAt:    (p.created_at ?? "").split("T")[0],
    }));

    setPosts(mapped);
    setIsFetching(false);
  }, [user?.id]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // ── Like / unlike ──────────────────────────────────────

  const toggleLike = async (postId: string) => {
    if (!user) return;

    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    // Optimistic update
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
          : p
      )
    );

    if (post.liked) {
      await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("post_likes")
        .insert({ post_id: postId, user_id: user.id });
    }
  };

  // ── Create post ────────────────────────────────────────

  const handleCreate = async () => {
    if (!newTitle.trim() || !user) return;
    setIsPosting(true);

    const parsed = postSchema.safeParse({ title: newTitle, description: newDesc, tag: newTag, category: newCategory });
    if (!parsed.success) {
      // show error - for now just return since there's no error state yet
      setIsPosting(false);
      return;
    }
    const sanitizedDesc = DOMPurify.sanitize(newDesc.trim());

    const { error } = await supabase.from("posts").insert({
      title:       newTitle.trim(),
      description: sanitizedDesc,
      content:     sanitizedDesc,
      author_id:   user.id,
      image:       PLACEHOLDER_IMAGE,
      tag:         newTag,
      category:    newCategory,
    });

    if (!error) {
      setNewTitle("");
      setNewDesc("");
      setModalOpen(false);
      await fetchPosts();
    }
    setIsPosting(false);
  };

  // ── Filtering ──────────────────────────────────────────

  const filtered = posts.filter((p) => {
    const matchTab =
      tab === "Todos" ||
      (tab === "Publicaciones" && p.category === "publicacion") ||
      (tab === "Portafolios"   && p.category === "portafolio");
    const matchTag    = tagFilter === "Todos" || p.tag === tagFilter;
    const matchSearch =
      search === "" ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.authorName ?? "").toLowerCase().includes(search.toLowerCase());
    return matchTab && matchTag && matchSearch;
  });

  const trendingTags = [
    { name: "Mecatrónica",   posts: 24 },
    { name: "Soldadura TIG", posts: 18 },
    { name: "Electricidad",  posts: 15 },
    { name: "Ebanistería",   posts: 11 },
    { name: "Evento",        posts:  8 },
  ];

  // ── Render ────────────────────────────────────────────

  return (
    <PageLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-5">

        {/* Page Header */}
        <div className="flex items-start justify-between animate-fade-in-up">
          <div>
            <p className="text-sm text-cyan-600 font-semibold mb-1">Comunidad</p>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">El Muro</h1>
            <p className="text-sm text-slate-500 mt-1">
              Comparte proyectos, logros y conecta con la comunidad.
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            disabled={!user}
            className="flex items-center gap-1.5 bg-cyan-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-cyan-700 active:bg-cyan-800 transition-colors shadow-sm btn-press disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus size={16} /> Publicar
          </button>
        </div>

        {/* Search + Tabs + Tag chips */}
        <div className="space-y-3 animate-fade-in-up stagger-2">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar publicaciones..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-cyan-200 focus:border-cyan-400 outline-none transition-shadow"
            />
          </div>

          <div className="flex items-center gap-4 border-b border-slate-200">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`pb-2.5 text-sm font-semibold transition-colors border-b-2 ${
                  tab === t
                    ? "border-cyan-500 text-cyan-700"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {TAG_FILTERS.map((t) => (
              <button
                key={t}
                onClick={() => setTagFilter(t)}
                className={`
                  whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all
                  ${tagFilter === t
                    ? "bg-cyan-600 text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
                  }
                `}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Main + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Feed Column */}
          <div className="lg:col-span-2 space-y-4">

            {/* Loading state */}
            {isFetching && (
              <div className="flex justify-center py-20">
                <Loader2 size={32} className="animate-spin text-cyan-400" />
              </div>
            )}

            {!isFetching && filtered.map((post, i) => (
              <article
                key={post.id}
                className={`
                  bg-white rounded-2xl border border-slate-200/60 overflow-hidden
                  hover:shadow-md hover:border-slate-300/60
                  transition-all duration-200
                  animate-fade-in-up stagger-${Math.min(i + 1, 6)}
                `}
              >
                {post.image && (
                  <div className="aspect-[2.2/1] relative overflow-hidden">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 right-3">
                      <span className="bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-bold text-cyan-700">
                        {post.tag}
                      </span>
                    </div>
                  </div>
                )}

                <div className="p-5">
                  <div className="flex items-center gap-2.5 mb-3">
                    {post.authorAvatar ? (
                      <img
                        src={post.authorAvatar}
                        alt={post.authorName || post.author}
                        className="w-9 h-9 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                        {(post.authorName || post.author).charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <span className="text-sm font-semibold">
                        {post.authorName || post.author}
                      </span>
                      {post.authorRole && (
                        <span className="text-[10px] text-slate-400 ml-2 bg-slate-100 px-1.5 py-0.5 rounded">
                          {post.authorRole}
                        </span>
                      )}
                      <p className="text-[10px] text-slate-400">{post.createdAt}</p>
                    </div>
                  </div>

                  <h3 className="font-bold text-lg mb-1.5">{post.title}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                    {post.content || post.description}
                  </p>

                  <div className="flex items-center gap-5 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => toggleLike(post.id)}
                      disabled={!user}
                      className={`flex items-center gap-1.5 text-sm font-medium transition-all active:scale-90 disabled:opacity-40 ${
                        post.liked ? "text-red-500" : "text-slate-400 hover:text-red-400"
                      }`}
                    >
                      <Heart
                        size={18}
                        className={`transition-all ${post.liked ? "fill-red-500 scale-110" : ""}`}
                      />
                      {post.likes}
                    </button>
                    <span className="flex items-center gap-1.5 text-sm text-slate-400 font-medium">
                      <MessageCircle size={18} /> {post.comments}
                    </span>
                  </div>
                </div>
              </article>
            ))}

            {!isFetching && filtered.length === 0 && (
              <div className="text-center py-20 bg-white rounded-2xl border border-slate-200/60 animate-scale-in">
                <Search size={48} className="mx-auto mb-4 text-slate-200" />
                <p className="text-slate-400 text-base font-medium">
                  No se encontraron publicaciones.
                </p>
                <button
                  onClick={() => { setSearch(""); setTagFilter("Todos"); setTab("Todos"); }}
                  className="mt-3 text-sm text-cyan-600 font-semibold hover:underline"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>

          {/* Sidebar (desktop) */}
          <div className="space-y-5 hidden lg:block">

            <div className="bg-white rounded-2xl p-5 border border-slate-200/60 animate-fade-in-up stagger-1">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={16} className="text-cyan-500" />
                <span className="font-bold text-sm">Tendencias</span>
              </div>
              <div className="space-y-1">
                {trendingTags.map((tag, i) => (
                  <button
                    key={tag.name}
                    onClick={() => setTagFilter(tag.name)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left group"
                  >
                    <span className="text-xs font-bold text-slate-300 w-5">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold group-hover:text-cyan-700 transition-colors">
                        {tag.name}
                      </p>
                      <p className="text-[10px] text-slate-400">{tag.posts} publicaciones</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/60 animate-fade-in-up stagger-2">
              <div className="flex items-center gap-2 mb-4">
                <Users size={16} className="text-violet-500" />
                <span className="font-bold text-sm">Miembros Activos</span>
              </div>
              <div className="space-y-2.5">
                {TALENT_PROFILES.slice(0, 5).map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <img src={t.avatar} alt={t.name} className="w-8 h-8 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{t.name}</p>
                      <p className="text-[10px] text-slate-400">{t.specialty}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-cyan-500 to-teal-600 rounded-2xl p-5 text-white animate-fade-in-up stagger-3">
              <Flame size={24} className="mb-2 opacity-80" />
              <p className="text-2xl font-extrabold">{posts.length}</p>
              <p className="text-sm opacity-90 mt-1">Publicaciones</p>
              <p className="text-xs opacity-70 mt-0.5">en la comunidad</p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Post Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nueva Publicación"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Título</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Título del proyecto..."
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-cyan-200 focus:border-cyan-400 outline-none transition-shadow"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Descripción</label>
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              rows={3}
              placeholder="Describe tu proyecto..."
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-cyan-200 focus:border-cyan-400 outline-none resize-none transition-shadow"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Categoría</label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as "publicacion" | "portafolio")}
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-cyan-200 outline-none bg-white"
            >
              <option value="publicacion">Publicación</option>
              <option value="portafolio">Portafolio</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Etiqueta</label>
            <select
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-cyan-200 outline-none bg-white"
            >
              {TAG_FILTERS.filter((t) => t !== "Todos").map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleCreate}
            disabled={!newTitle.trim() || isPosting}
            className="w-full bg-cyan-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-cyan-700 active:bg-cyan-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors btn-press flex items-center justify-center gap-2"
          >
            {isPosting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Publicando…
              </>
            ) : (
              "Publicar"
            )}
          </button>
        </div>
      </Modal>
    </PageLayout>
  );
}
