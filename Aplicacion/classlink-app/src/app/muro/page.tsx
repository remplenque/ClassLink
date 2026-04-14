"use client";
// ──────────────────────────────────────────────────────────
// El Muro – Community feed (Supabase-backed)
// ──────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from "react";
import PageLayout from "@/components/layout/PageLayout";
import Modal      from "@/components/ui/Modal";
import { supabase } from "@/lib/supabase";
import { useAuth }  from "@/lib/auth-context";
import { useRole }  from "@/lib/role-context";
import { useSound } from "@/lib/hooks/useSound";
import type { FeedPost, PostComment } from "@/lib/types";
import {
  Heart, MessageCircle, Plus, Search, TrendingUp, Users, Flame, Loader2,
  ImagePlus, X, Video, FileImage, Clock, MapPin, Briefcase, Send, Volume2, VolumeX,
} from "lucide-react";
import { postSchema } from "@/lib/schemas";
import DOMPurify from "isomorphic-dompurify";

// ── Constants ─────────────────────────────────────────────

const TABS = ["Todos", "Portafolios", "Eventos", "Ofertas de Trabajo"] as const;

const TAG_FILTERS = [
  "Todos", "Mecatrónica", "Electricidad", "Soldadura TIG", "Ebanistería",
  "Refrigeración", "Informática", "Construcción", "Automotriz", "Evento", "Oferta Laboral",
];

const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".avi", ".mkv"];

function isVideoUrl(url: string) {
  if (!url) return false;
  const lower = url.toLowerCase().split("?")[0];
  return VIDEO_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

// ── Component ─────────────────────────────────────────────

export default function MuroPage() {
  const { user } = useAuth();
  const { role } = useRole();
  const { muted, toggleMute, playLike, playComment, playPost } = useSound();

  // ── Comment system state ───────────────────────────────
  const [expandedPostId,    setExpandedPostId]    = useState<string | null>(null);
  const [commentsByPost,    setCommentsByPost]    = useState<Record<string, PostComment[]>>({});
  const [loadingComments,   setLoadingComments]   = useState<Set<string>>(new Set());
  const [commentDraft,      setCommentDraft]      = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const [posts,       setPosts]       = useState<FeedPost[]>([]);
  const [jobPosts,    setJobPosts]    = useState<FeedPost[]>([]);
  const [tab,         setTab]         = useState<string>("Todos");
  const [tagFilter,   setTagFilter]   = useState("Todos");
  const [search,      setSearch]      = useState("");
  const [modalOpen,   setModalOpen]   = useState(false);
  const [isFetching,  setIsFetching]  = useState(true);
  const [isPosting,   setIsPosting]   = useState(false);
  const [postError,   setPostError]   = useState<string | null>(null);

  // New post form fields
  const [newTitle,          setNewTitle]          = useState("");
  const [newDesc,           setNewDesc]           = useState("");
  const [newTag,            setNewTag]            = useState("Mecatrónica");
  const [newCategory,       setNewCategory]       = useState<"publicacion" | "portafolio" | "oferta">("publicacion");
  // Offer-specific fields
  const [offerSpecialty,    setOfferSpecialty]    = useState("Mecatronica");
  const [offerDuration,     setOfferDuration]     = useState("");
  const [offerPaid,         setOfferPaid]         = useState(true);
  const [offerSalary,       setOfferSalary]       = useState("");
  const [offerLocation,     setOfferLocation]     = useState("");

  // Media upload for new post
  const [mediaFile,    setMediaFile]    = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isVideo,      setIsVideo]      = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active members sidebar (real data)
  const [activeMembers, setActiveMembers] = useState<any[]>([]);

  // ── Fetch posts ────────────────────────────────────────

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

    if (error || !data) { setIsFetching(false); return; }

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

  // ── Fetch job postings for "Ofertas de Trabajo" tab ──

  const fetchJobPostings = useCallback(async () => {
    const { data } = await supabase
      .from("job_postings")
      .select("id, title, description, location, type, specialty, active, created_at, profiles!job_postings_company_id_fkey(name, avatar)")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(50);

    const mapped: FeedPost[] = (data ?? []).map((j: any) => ({
      id:           `jp-${j.id}`,
      title:        j.title,
      description:  j.description ?? "",
      content:      j.description ?? "",
      author:       j.id,
      authorName:   j.profiles?.name ?? "Empresa",
      authorAvatar: j.profiles?.avatar ?? "",
      authorRole:   "Empresa" as const,
      image:        "",
      tag:          j.specialty ?? "Oferta Laboral",
      likes:        0,
      liked:        false,
      comments:     0,
      category:     "oferta" as const,
      createdAt:    (j.created_at ?? "").split("T")[0],
      offerSpecialty: j.specialty ?? "",
      offerLocation:  j.location ?? "",
      offerPaid:      true,
    }));
    setJobPosts(mapped);
  }, []);

  // ── Fetch active members ───────────────────────────────

  const fetchMembers = useCallback(async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, name, avatar, specialty, role")
      .in("role", ["Estudiante", "Egresado", "Empresa"])
      .limit(5);
    setActiveMembers(data ?? []);
  }, []);

  useEffect(() => {
    fetchPosts();
    fetchJobPostings();
    fetchMembers();
  }, [fetchPosts, fetchJobPostings, fetchMembers]);

  // ── Media selection ────────────────────────────────────

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 50 * 1024 * 1024; // 50 MB for videos, 5 MB for images enforced below
    const isVideoFile = file.type.startsWith("video/");

    if (!isVideoFile && file.size > 5 * 1024 * 1024) {
      setPostError("Las imágenes deben ser menores a 5MB.");
      return;
    }
    if (isVideoFile && file.size > maxSize) {
      setPostError("Los videos deben ser menores a 50MB.");
      return;
    }

    const allowedImages = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const allowedVideos = ["video/mp4", "video/webm", "video/quicktime"];

    if (!allowedImages.includes(file.type) && !allowedVideos.includes(file.type)) {
      setPostError("Formato no soportado. Usa JPEG, PNG, WebP, GIF, MP4, WebM o MOV.");
      return;
    }

    setPostError(null);
    setMediaFile(file);
    setIsVideo(isVideoFile);
    const url = URL.createObjectURL(file);
    setMediaPreview(url);
  };

  const clearMedia = () => {
    setMediaFile(null);
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setMediaPreview(null);
    setIsVideo(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Like / unlike ──────────────────────────────────────

  const toggleLike = async (postId: string) => {
    if (!user) return;
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
          : p
      )
    );
    if (!post.liked) playLike();

    if (post.liked) {
      await supabase.from("post_likes").delete()
        .eq("post_id", postId).eq("user_id", user.id);
    } else {
      await supabase.from("post_likes").insert({ post_id: postId, user_id: user.id });
    }
  };

  // ── Create post ────────────────────────────────────────

  const handleCreate = async () => {
    if (!newTitle.trim() || !user) return;
    setIsPosting(true);
    setPostError(null);

    const parsed = postSchema.safeParse({
      title: newTitle, description: newDesc, tag: newTag, category: newCategory,
    });
    if (!parsed.success) {
      setPostError(parsed.error.issues[0]?.message ?? "Error de validación");
      setIsPosting(false);
      return;
    }

    const sanitizedDesc = DOMPurify.sanitize(newDesc.trim());

    // Upload media to Supabase Storage if provided
    let mediaUrl = "";
    if (mediaFile && user.id) {
      const ext  = mediaFile.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: storageErr } = await supabase.storage
        .from("post-media")
        .upload(path, mediaFile, { upsert: false });

      if (storageErr) {
        setPostError(
          storageErr.message.includes("not found") || storageErr.message.includes("Bucket")
            ? "El bucket 'post-media' no existe en Supabase Storage. Créalo como bucket público en tu panel de Supabase."
            : `No se pudo subir el archivo: ${storageErr.message}`
        );
        setIsPosting(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("post-media")
        .getPublicUrl(path);
      mediaUrl = publicUrl;
    }

    const { error } = await supabase.from("posts").insert({
      title:       newTitle.trim(),
      description: sanitizedDesc,
      content:     sanitizedDesc,
      author_id:   user.id,
      image:       mediaUrl || "",
      tag:         newTag,
      category:    newCategory,
    });

    if (error) {
      setPostError(error.message);
      setIsPosting(false);
      return;
    }

    // Reset form
    setNewTitle("");
    setNewDesc("");
    setOfferSpecialty("Mecatronica");
    setOfferDuration("");
    setOfferPaid(true);
    setOfferSalary("");
    setOfferLocation("");
    clearMedia();
    playPost();
    setModalOpen(false);
    await fetchPosts();
    setIsPosting(false);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setPostError(null);
    clearMedia();
  };

  // ── Comment system ─────────────────────────────────────

  const fetchComments = useCallback(async (postId: string) => {
    setLoadingComments((prev) => new Set(prev).add(postId));
    const { data } = await supabase
      .from("post_comments")
      .select(`id, post_id, content, created_at, author_id, profiles!author_id(name, avatar, role)`)
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    const mapped: PostComment[] = (data ?? []).map((c: any) => ({
      id:           c.id,
      postId:       c.post_id,
      authorId:     c.author_id,
      authorName:   c.profiles?.name   ?? "Usuario",
      authorAvatar: c.profiles?.avatar ?? "",
      authorRole:   c.profiles?.role   ?? "Estudiante",
      content:      c.content,
      createdAt:    (c.created_at ?? "").split("T")[0],
    }));

    setCommentsByPost((prev) => ({ ...prev, [postId]: mapped }));
    setLoadingComments((prev) => { const s = new Set(prev); s.delete(postId); return s; });
  }, []);

  const toggleComments = (postId: string) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null);
      setCommentDraft("");
    } else {
      setExpandedPostId(postId);
      setCommentDraft("");
      if (!commentsByPost[postId]) fetchComments(postId);
    }
  };

  const submitComment = async (postId: string) => {
    if (!user || !commentDraft.trim() || submittingComment) return;
    setSubmittingComment(true);

    const draft        = commentDraft.trim();
    const optimisticId = `opt-${Date.now()}`;
    const optimistic: PostComment = {
      id:           optimisticId,
      postId,
      authorId:     user.id,
      authorName:   user.name,
      authorAvatar: user.avatar ?? "",
      authorRole:   user.role,
      content:      draft,
      createdAt:    new Date().toISOString().split("T")[0],
    };

    // Optimistic update
    setCommentsByPost((prev) => ({ ...prev, [postId]: [...(prev[postId] ?? []), optimistic] }));
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, comments: p.comments + 1 } : p));
    setCommentDraft("");
    playComment();

    const { data, error } = await supabase
      .from("post_comments")
      .insert({ post_id: postId, author_id: user.id, content: draft })
      .select(`id, post_id, content, created_at, author_id, profiles!author_id(name, avatar, role)`)
      .single();

    if (error) {
      // Rollback
      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: (prev[postId] ?? []).filter((c) => c.id !== optimisticId),
      }));
      setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, comments: p.comments - 1 } : p));
      setCommentDraft(draft);
    } else if (data) {
      const real: PostComment = {
        id:           data.id,
        postId:       data.post_id,
        authorId:     data.author_id,
        authorName:   (data as any).profiles?.name   ?? user.name,
        authorAvatar: (data as any).profiles?.avatar ?? user.avatar ?? "",
        authorRole:   (data as any).profiles?.role   ?? user.role,
        content:      data.content,
        createdAt:    (data.created_at ?? "").split("T")[0],
      };
      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: (prev[postId] ?? []).map((c) => (c.id === optimisticId ? real : c)),
      }));
    }

    setSubmittingComment(false);
  };

  // ── Filtering ──────────────────────────────────────────

  // Merge job_postings into the "Ofertas de Trabajo" source pool
  const allPosts = tab === "Ofertas de Trabajo"
    ? [...posts.filter((p) => p.category === "oferta"), ...jobPosts]
    : posts;

  const offerCount = posts.filter((p) => p.category === "oferta").length + jobPosts.length;

  const filtered = allPosts.filter((p) => {
    const matchTab =
      tab === "Todos" ||
      (tab === "Portafolios"       && p.category === "portafolio") ||
      (tab === "Eventos"           && (p.category === "evento" || p.category === "publicacion")) ||
      (tab === "Ofertas de Trabajo" && p.category === "oferta");
    const matchSearch =
      search === "" ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.authorName ?? "").toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const trendingTags = [
    { name: "Mecatrónica",   posts: 24 },
    { name: "Soldadura TIG", posts: 18 },
    { name: "Electricidad",  posts: 15 },
    { name: "Ebanistería",   posts: 11 },
    { name: "Construcción",  posts:  9 },
    { name: "Automotriz",    posts:  8 },
    { name: "Refrigeración", posts:  7 },
    { name: "Evento",        posts:  6 },
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
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
              title={muted ? "Activar sonidos" : "Silenciar sonidos"}
            >
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <button
              onClick={() => { if (role === "Empresa") setNewCategory("oferta"); setModalOpen(true); }}
              disabled={!user}
              className="flex items-center gap-1.5 bg-cyan-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-cyan-700 active:bg-cyan-800 transition-colors shadow-sm btn-press disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus size={16} /> Publicar
            </button>
          </div>
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

          <div className="flex items-center gap-4 border-b border-slate-200 overflow-x-auto no-scrollbar">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`pb-2.5 text-sm font-semibold transition-colors border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
                  tab === t
                    ? "border-cyan-500 text-cyan-700"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                {t}
                {t === "Ofertas de Trabajo" && offerCount > 0 && (
                  <span className="bg-violet-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {offerCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Main + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Feed Column */}
          <div className="lg:col-span-2 space-y-4">

            {isFetching && Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden animate-pulse">
                <div className="aspect-[2.2/1] bg-slate-100" />
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-200" />
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-28 bg-slate-200 rounded" />
                      <div className="h-2.5 w-16 bg-slate-100 rounded" />
                    </div>
                  </div>
                  <div className="h-5 w-3/4 bg-slate-200 rounded" />
                  <div className="h-3.5 w-full bg-slate-100 rounded" />
                  <div className="h-3.5 w-2/3 bg-slate-100 rounded" />
                  <div className="h-px bg-slate-100 mt-1" />
                  <div className="flex gap-5 pt-1">
                    <div className="h-5 w-10 bg-slate-100 rounded" />
                    <div className="h-5 w-10 bg-slate-100 rounded" />
                  </div>
                </div>
              </div>
            ))}

            {!isFetching && filtered.map((post, i) => {
              // ── Job Offer Card ──
              if (post.category === "oferta") {
                return (
                  <article
                    key={post.id}
                    className={`
                      bg-white rounded-2xl border border-violet-200/60 overflow-hidden
                      hover:shadow-md hover:border-violet-300/60
                      transition-all duration-200
                      animate-fade-in-up stagger-${Math.min(i + 1, 6)}
                    `}
                  >
                    {/* Violet gradient accent bar */}
                    <div className="h-1.5 bg-gradient-to-r from-violet-500 to-purple-600" />

                    <div className="p-5">
                      {/* Company header */}
                      <div className="flex items-center gap-2.5 mb-3">
                        {post.authorAvatar ? (
                          <img src={post.authorAvatar} alt={post.authorName || post.author} className="w-9 h-9 rounded-xl object-cover" />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center text-xs font-bold text-violet-600">
                            {(post.authorName || post.author).charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <span className="text-sm font-semibold">{post.authorName || post.author}</span>
                          <span className="text-[10px] text-violet-500 ml-2 bg-violet-50 px-1.5 py-0.5 rounded font-medium">Empresa</span>
                          <p className="text-[10px] text-slate-400">{post.createdAt}</p>
                        </div>
                        <span className="ml-auto text-[10px] bg-violet-50 text-violet-600 font-bold px-2.5 py-1 rounded-full border border-violet-100 flex items-center gap-1">
                          <Briefcase size={10} /> Oferta
                        </span>
                      </div>

                      {/* Job title & description */}
                      <h3 className="font-bold text-lg mb-1">{post.title}</h3>
                      <p className="text-sm text-slate-500 line-clamp-2 mb-3">
                        {post.content || post.description}
                      </p>

                      {/* Detail chips */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.offerDuration && (
                          <span className="flex items-center gap-1 text-[11px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">
                            <Clock size={11} /> {post.offerDuration}
                          </span>
                        )}
                        {post.offerLocation && (
                          <span className="flex items-center gap-1 text-[11px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">
                            <MapPin size={11} /> {post.offerLocation}
                          </span>
                        )}
                        {post.offerPaid === true ? (
                          <span className="flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-semibold border border-emerald-100">
                            Remunerada {post.offerSalary ? `· ${post.offerSalary}` : ""}
                          </span>
                        ) : post.offerPaid === false ? (
                          <span className="text-[11px] bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full font-semibold border border-amber-100">
                            Sin remuneración
                          </span>
                        ) : null}
                      </div>

                      {/* CTA */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-5">
                          <button
                            onClick={() => toggleLike(post.id)}
                            disabled={!user}
                            className={`flex items-center gap-1.5 text-sm font-medium transition-all active:scale-90 disabled:opacity-40 ${post.liked ? "text-red-500" : "text-slate-400 hover:text-red-400"}`}
                          >
                            <Heart size={18} className={`transition-all ${post.liked ? "fill-red-500 scale-110" : ""}`} />
                            {post.likes}
                          </button>
                          <span className="flex items-center gap-1.5 text-sm text-slate-400 font-medium">
                            <MessageCircle size={18} /> {post.comments}
                          </span>
                        </div>
                        <button className="bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors">
                          Postular via Colegio
                        </button>
                      </div>
                    </div>
                  </article>
                );
              }

              // ── Regular Post Card ──
              return (
                <article
                  key={post.id}
                  className={`
                    bg-white rounded-2xl border border-slate-200/60 overflow-hidden
                    hover:shadow-md hover:border-slate-300/60
                    transition-all duration-200
                    animate-fade-in-up stagger-${Math.min(i + 1, 6)}
                  `}
                >
                  {/* Media: image or video */}
                  {post.image && (
                    <div className="aspect-[2.2/1] relative overflow-hidden bg-slate-100">
                      {isVideoUrl(post.image) ? (
                        <video
                          src={post.image}
                          controls
                          className="w-full h-full object-cover"
                          preload="metadata"
                        />
                      ) : (
                        <img
                          src={post.image}
                          alt={post.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                        />
                      )}
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
                      <button
                        onClick={() => toggleComments(post.id)}
                        disabled={!user}
                        className={`flex items-center gap-1.5 text-sm font-medium transition-all active:scale-90 disabled:opacity-40 ${
                          expandedPostId === post.id ? "text-cyan-600" : "text-slate-400 hover:text-cyan-500"
                        }`}
                      >
                        <MessageCircle
                          size={18}
                          className={`transition-all ${expandedPostId === post.id ? "fill-cyan-100" : ""}`}
                        />
                        {post.comments}
                      </button>
                      {!post.image && (
                        <span className="ml-auto text-[10px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full">
                          {post.tag}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ── Inline Comment Panel ── */}
                  {expandedPostId === post.id && (
                    <div className="border-t border-slate-100 bg-slate-50/50 px-5 pb-4 pt-3 space-y-3 animate-fade-in-up">

                      {/* Comment list */}
                      {loadingComments.has(post.id) ? (
                        <div className="space-y-2.5 animate-pulse">
                          {[0, 1].map((j) => (
                            <div key={j} className="flex gap-2">
                              <div className="w-7 h-7 rounded-lg bg-slate-200 flex-shrink-0" />
                              <div className="flex-1 space-y-1.5">
                                <div className="h-3 w-24 bg-slate-200 rounded" />
                                <div className="h-3 w-full bg-slate-100 rounded" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
                          {(commentsByPost[post.id] ?? []).length === 0 && (
                            <p className="text-xs text-slate-400 text-center py-3">
                              Sin comentarios aún. ¡Sé el primero!
                            </p>
                          )}
                          {(commentsByPost[post.id] ?? []).map((c) => (
                            <div key={c.id} className="flex gap-2 items-start">
                              {c.authorAvatar ? (
                                <img
                                  src={c.authorAvatar}
                                  alt={c.authorName}
                                  className="w-7 h-7 rounded-lg object-cover flex-shrink-0"
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center text-[11px] font-bold text-slate-500 flex-shrink-0">
                                  {c.authorName.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="bg-white rounded-xl px-3 py-2 flex-1 border border-slate-100 shadow-sm">
                                <div className="flex items-baseline gap-2">
                                  <span className="text-xs font-semibold text-slate-700">{c.authorName}</span>
                                  <span className="text-[10px] text-slate-400">{c.createdAt}</span>
                                </div>
                                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{c.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Comment input — only for authenticated users */}
                      {user && (
                        <div className="flex gap-2 items-center pt-1">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-7 h-7 rounded-lg object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-lg bg-cyan-100 flex items-center justify-center text-[11px] font-bold text-cyan-600 flex-shrink-0">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <input
                            type="text"
                            value={commentDraft}
                            onChange={(e) => setCommentDraft(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                submitComment(post.id);
                              }
                            }}
                            placeholder="Escribe un comentario..."
                            className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-cyan-200 focus:border-cyan-400 outline-none transition-shadow"
                          />
                          <button
                            onClick={() => submitComment(post.id)}
                            disabled={!commentDraft.trim() || submittingComment}
                            className="w-8 h-8 bg-cyan-600 rounded-xl flex items-center justify-center hover:bg-cyan-700 active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0"
                          >
                            {submittingComment ? (
                              <Loader2 size={13} className="animate-spin text-white" />
                            ) : (
                              <Send size={13} className="text-white" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}

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
                {TAG_FILTERS.filter((t) => t !== "Todos").map((tag, i) => {
                  const count = posts.filter((p) => p.tag === tag).length;
                  return (
                    <button
                      key={tag}
                      onClick={() => setTagFilter(tag)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left group"
                    >
                      <span className="text-xs font-bold text-slate-300 w-5">#{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold group-hover:text-cyan-700 transition-colors">
                          {tag}
                        </p>
                        <p className="text-[10px] text-slate-400">{count} publicaciones</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active members — real data from DB */}
            {activeMembers.length > 0 && (
              <div className="bg-white rounded-2xl p-5 border border-slate-200/60 animate-fade-in-up stagger-2">
                <div className="flex items-center gap-2 mb-4">
                  <Users size={16} className="text-violet-500" />
                  <span className="font-bold text-sm">Miembros</span>
                </div>
                <div className="space-y-2.5">
                  {activeMembers.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      {m.avatar ? (
                        <img src={m.avatar} alt={m.name} className="w-8 h-8 rounded-lg object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold">
                          {m.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{m.name}</p>
                        <p className="text-[10px] text-slate-400">{m.specialty ?? m.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-gradient-to-br from-cyan-500 to-teal-600 rounded-2xl p-5 text-white animate-fade-in-up stagger-3">
              <Flame size={24} className="mb-2 opacity-80" />
              <p className="text-2xl font-extrabold">{posts.length}</p>
              <p className="text-sm opacity-90 mt-1">Publicaciones</p>
              <p className="text-xs opacity-70 mt-0.5">en la comunidad</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Create Post Modal ── */}
      <Modal open={modalOpen} onClose={handleModalClose} title="Nueva Publicación">
        <div className="space-y-4">

          {postError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {postError}
            </div>
          )}

          {/* Title */}
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

          {/* Description */}
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

          {/* Media Upload */}
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">
              Imagen o Video (opcional)
            </label>

            {mediaPreview ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                {isVideo ? (
                  <video
                    src={mediaPreview}
                    controls
                    className="w-full max-h-48 object-cover"
                  />
                ) : (
                  <img
                    src={mediaPreview}
                    alt="Vista previa"
                    className="w-full max-h-48 object-cover"
                  />
                )}
                <button
                  onClick={clearMedia}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
                >
                  <X size={14} className="text-white" />
                </button>
                <div className="absolute bottom-2 left-2">
                  <span className="bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                    {isVideo ? <Video size={10} /> : <FileImage size={10} />}
                    {isVideo ? "Video" : "Imagen"}
                  </span>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-28 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors gap-2">
                <ImagePlus size={22} className="text-slate-300" />
                <span className="text-xs text-slate-400">
                  Clic para subir imagen o video
                </span>
                <span className="text-[10px] text-slate-300">
                  JPEG, PNG, WebP, GIF · MP4, WebM, MOV
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                  className="hidden"
                  onChange={handleMediaSelect}
                />
              </label>
            )}
          </div>

          {/* Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Categoría</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as "publicacion" | "portafolio" | "oferta")}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-cyan-200 outline-none bg-white"
              >
                {role === "Empresa" ? (
                  <>
                    <option value="oferta">Oferta de Trabajo</option>
                    <option value="publicacion">Publicación</option>
                  </>
                ) : (
                  <>
                    <option value="publicacion">Publicación</option>
                    <option value="portafolio">Portafolio</option>
                  </>
                )}
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
          </div>

          {/* Offer-specific fields (Empresa + oferta category) */}
          {role === "Empresa" && newCategory === "oferta" && (
            <div className="space-y-3 border border-violet-100 rounded-xl p-4 bg-violet-50/50">
              <p className="text-xs font-bold text-violet-700 mb-2">Detalles de la oferta</p>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Especialidad</label>
                <select
                  value={offerSpecialty}
                  onChange={(e) => setOfferSpecialty(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-violet-200 outline-none bg-white"
                >
                  <option value="Mecatronica">Mecatrónica</option>
                  <option value="Electricidad">Electricidad</option>
                  <option value="Soldadura">Soldadura</option>
                  <option value="Ebanisteria">Ebanistería</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Duración</label>
                  <input
                    value={offerDuration}
                    onChange={(e) => setOfferDuration(e.target.value)}
                    placeholder="Ej: 3 meses"
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-violet-200 focus:border-violet-400 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Ubicación</label>
                  <input
                    value={offerLocation}
                    onChange={(e) => setOfferLocation(e.target.value)}
                    placeholder="Ej: Santiago"
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-violet-200 focus:border-violet-400 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Remuneración</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setOfferPaid(true)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${offerPaid ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"}`}
                  >Sí</button>
                  <button
                    type="button"
                    onClick={() => setOfferPaid(false)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${!offerPaid ? "bg-amber-500 text-white border-amber-500" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"}`}
                  >No</button>
                </div>
              </div>
              {offerPaid && (
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Monto</label>
                  <input
                    value={offerSalary}
                    onChange={(e) => setOfferSalary(e.target.value)}
                    placeholder="Ej: $350.000/mes"
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-violet-200 focus:border-violet-400 outline-none"
                  />
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleCreate}
            disabled={!newTitle.trim() || isPosting}
            className="w-full bg-cyan-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-cyan-700 active:bg-cyan-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors btn-press flex items-center justify-center gap-2"
          >
            {isPosting ? (
              <><Loader2 size={16} className="animate-spin" /> Publicando…</>
            ) : (
              "Publicar"
            )}
          </button>
        </div>
      </Modal>
    </PageLayout>
  );
}
