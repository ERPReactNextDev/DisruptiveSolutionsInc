"use client";
import React, { useEffect, useState } from "react";
import { SmartImage } from "@/components/ui/smart-image";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { Loader2, ArrowLeft, Facebook, Instagram, Linkedin, ArrowRight, ChevronUp, Calendar, Tag } from "lucide-react";
import Link from "next/link";
import Navbar from "../../components/navigation/navbar";
import Footer from "../../components/navigation/footer";

export default function BlogDetailPage() {
    const { slug } = useParams();
    const [blog, setBlog] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBlog = async () => {
            if (!slug) return;
            try {
                const q = query(
                    collection(db, "blogs"),
                    where("slug", "==", slug),
                    where("website", "==", "disruptivesolutionsinc"),
                    limit(1)
                );
                const snapshot = await getDocs(q);
                if (!snapshot.empty) {
                    setBlog(snapshot.docs[0].data());
                } else {
                    setBlog(null);
                }
            } catch (err) {
                console.error("Firestore Error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchBlog();
    }, [slug]);

    const formatDate = (timestamp: any) => {
        if (!timestamp) return "";
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return new Intl.DateTimeFormat("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
        }).format(date);
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-white">
                <Loader2 className="animate-spin text-[#d11a2a]" size={32} />
            </div>
        );
    }

    if (!blog) {
        return (
            <div className="h-screen flex flex-col items-center justify-center gap-4">
                <p className="text-sm font-black uppercase tracking-widest text-gray-400">Story Not Found</p>
                <Link href="/blog" className="text-[#d11a2a] text-xs font-bold uppercase tracking-widest hover:underline">
                    ← Back to Insights
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white font-sans">
            <Navbar />

            {/* ── HERO COVER ─────────────────────────────────────────── */}
            {blog.coverImage && (
                <div className="w-full bg-[#0a0a0a] overflow-hidden" style={{ maxHeight: "560px" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={blog.coverImage}
                        alt={blog.title || "Blog Cover"}
                        className="w-full object-cover opacity-90"
                        style={{ maxHeight: "560px", width: "100%", objectFit: "cover" }}
                    />
                </div>
            )}

            {/* ── ARTICLE WRAPPER ────────────────────────────────────── */}
            <div className="max-w-3xl mx-auto px-5 md:px-6">

                {/* Back link */}
                <div className="pt-8 pb-4">
                    <Link
                        href="/blog"
                        className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#d11a2a] transition-colors"
                    >
                        <ArrowLeft size={13} /> Back to Insights
                    </Link>
                </div>

                {/* Meta — category + date */}
                <div className="flex flex-wrap items-center gap-4 mb-4">
                    {blog.category && (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#d11a2a]">
                            <Tag size={10} />
                            {blog.category}
                        </span>
                    )}
                    {blog.createdAt && (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            <Calendar size={10} />
                            {formatDate(blog.createdAt)}
                        </span>
                    )}
                </div>

                {/* Title */}
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight tracking-tight mb-8">
                    {blog.title}
                </h1>

                {/* Divider */}
                <div className="flex items-center gap-3 mb-10">
                    <div className="w-10 h-1 bg-[#d11a2a] rounded-full" />
                    <div className="flex-1 h-px bg-gray-100" />
                </div>

                {/* ── CONTENT SECTIONS ───────────────────────────────── */}
                <div className="prose-blog">
                    <style jsx global>{`
                        .prose-blog h1 { font-size: 1.875rem; font-weight: 800; line-height: 1.2; margin: 2rem 0 1rem; color: #111; }
                        .prose-blog h2 { font-size: 1.5rem; font-weight: 700; line-height: 1.3; margin: 2rem 0 0.75rem; color: #111; }
                        .prose-blog h3 { font-size: 1.25rem; font-weight: 700; line-height: 1.4; margin: 1.5rem 0 0.5rem; color: #111; }
                        .prose-blog p { margin: 0 0 1.25rem; color: #374151; font-size: 1rem; line-height: 1.8; }
                        .prose-blog strong { font-weight: 700; color: #111; }
                        .prose-blog em { font-style: italic; }
                        .prose-blog ul { list-style-type: disc; padding-left: 1.5rem; margin: 1rem 0 1.25rem; }
                        .prose-blog ol { list-style-type: decimal; padding-left: 1.5rem; margin: 1rem 0 1.25rem; }
                        .prose-blog li { margin: 0.4rem 0; color: #374151; line-height: 1.7; }
                        .prose-blog a { color: #d11a2a; text-decoration: underline; }
                        .prose-blog a:hover { color: #000; }
                        .prose-blog blockquote { border-left: 4px solid #d11a2a; padding: 0.75rem 1.25rem; margin: 1.5rem 0; background: #fdf2f2; border-radius: 0 0.5rem 0.5rem 0; }
                        .prose-blog blockquote p { color: #6b7280; font-style: italic; margin: 0; }
                    `}</style>

                    {blog.sections?.map((section: any, index: number) => (
                        <div key={index} className="mb-12">

                            {/* Section heading */}
                            {section.title && (
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-5 leading-snug">
                                    {section.title}
                                </h2>
                            )}

                            {/* Section image — full width, natural aspect ratio */}
                            {section.imageUrl && (
                                <div className="my-6 rounded-2xl overflow-hidden shadow-md bg-gray-50">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={section.imageUrl}
                                        alt={section.title || `Section ${index + 1}`}
                                        className="w-full h-auto"
                                        loading="lazy"
                                    />
                                </div>
                            )}

                            {/* Section rich text */}
                            {section.description && (
                                <div
                                    className="prose-blog"
                                    dangerouslySetInnerHTML={{ __html: section.description }}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* ── SHARE BAR ──────────────────────────────────────── */}
                <div className="flex items-center gap-4 py-10 border-t border-gray-100 mt-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Share</span>
                    {[
                        { icon: Facebook, label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${typeof window !== "undefined" ? encodeURIComponent(window.location.href) : ""}` },
                        { icon: Linkedin, label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${typeof window !== "undefined" ? encodeURIComponent(window.location.href) : ""}` },
                    ].map(({ icon: Icon, label, href }) => (
                        <a
                            key={label}
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Share on ${label}`}
                            className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#d11a2a] hover:border-[#d11a2a] transition-all"
                        >
                            <Icon size={15} />
                        </a>
                    ))}
                    <div className="flex-1" />
                    <Link
                        href="/blog"
                        className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#d11a2a] transition-colors flex items-center gap-1"
                    >
                        More Articles <ArrowRight size={12} />
                    </Link>
                </div>
            </div>

            <Footer />
        </div>
    );
}
