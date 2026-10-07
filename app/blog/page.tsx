"use client";

import React, { useState, useEffect } from "react";
import { SmartImage } from "@/components/ui/smart-image";
import Link from "next/link"; 
import { motion, AnimatePresence } from "framer-motion"; 
import { ArrowRight, Loader2, ChevronUp, Facebook, Instagram, Linkedin, Bookmark, Calendar } from "lucide-react"; 
import { auth, db } from "@/lib/firebase"; 
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, orderBy, onSnapshot, where, addDoc, serverTimestamp } from "firebase/firestore";
import SignUpNewsletter from "../components/SignUpNewsletter";    
import Footer from "../components/navigation/footer";
import Navbar from "../components/navigation/navbar";
import FloatingChatWidget  from "../components/chat-widget";
import FloatingMenuWidget from "../components/menu-widget";

export default function BlogPage() {
    const [blogs, setBlogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [userSession, setUserSession] = useState<any>(null);

    // Helper function to strip HTML tags and get plain text
    const stripHtml = (html: string) => {
        if (!html) return "";
        const tmp = document.createElement("DIV");
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || "";
    };

    // --- ACTIVITY LOGGER ENGINE ---
    const logActivity = async (actionName: string) => {
        try {
            await addDoc(collection(db, "cmsactivity_logs"), {
                page: actionName,
                timestamp: serverTimestamp(),
                userAgent: typeof window !== "undefined" ? navigator.userAgent : "Server",
                userEmail: userSession?.email || "Anonymous Visitor",
            });
        } catch (err) {
            console.error("Blog Log Failed:", err);
        }
    };

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => setUserSession(user));
        return () => unsubscribeAuth();
    }, []);

// FETCH REAL BLOGS FROM FIREBASE (Published Only)
    useEffect(() => {
        // Using two where clauses + orderBy requires a Firestore composite index.
        // To avoid index issues, we filter status client-side.
        const q = query(
            collection(db, "blogs"), 
            where("website", "==", "disruptivesolutionsinc"),
            orderBy("createdAt", "desc")
        );
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedBlogs = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter((blog: any) => blog.status === "Published")
                .slice(0, 6);
            setBlogs(fetchedBlogs);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching blogs:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-black">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-[#d11a2a]" size={40} />
                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/30">Loading Insights</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-[#d11a2a]/10 selection:text-[#d11a2a] overflow-x-hidden">
        <FloatingMenuWidget/>
        <Navbar/>

            {/* --- HERO SECTION WITH BG --- */}
            <section className="relative pt-48 pb-32 px-6 overflow-hidden bg-[#0a0a0a]">
                {/* Visual Background Elements */}
                <div className="absolute inset-0 z-0">
                    <SmartImage 
                        src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop" 
                        alt="Background" 
                        className="w-full h-full object-cover opacity-20"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-transparent to-white" />
                    

                </div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="mb-24 text-center md:text-left">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            <span className="text-[#d11a2a] text-[10px] font-black uppercase tracking-[0.5em] mb-4 block italic">Knowledge Base</span>
                            <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter uppercase leading-[0.85] mb-6">
                                OUR DISRUPTIVE<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d11a2a] to-gray-500">INSIGHTS</span>
                            </h1>
                            <p className="text-gray-400 max-w-xl text-lg font-medium leading-relaxed">
                                Explore the latest trends in smart lighting, IoT integration, and sustainable urban infrastructure.
                            </p>
                        </motion.div>
                    </div>

                   {/* DYNAMIC BLOG GRID */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
    {blogs.map((blog) => {
        // Get plain text excerpt from rich text HTML
        const excerpt = blog.sections?.[0]?.description 
            ? stripHtml(blog.sections[0].description).substring(0, 150) + '...'
            : "Breaking the boundaries of modern technology and architecture.";

        // Format date
        const formatDate = (timestamp: any) => {
            if (!timestamp) return "Recently";
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            return new Intl.DateTimeFormat('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
            }).format(date);
        };

        return (
            <motion.div
                key={blog.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
            >
                <Link 
                    href={`/blog/${blog.slug || blog.id}`} 
                    onClick={() => logActivity(`Blog: Read ${blog.title}`)}
                    className="group"
                >
                    <div className="bg-white rounded-none overflow-hidden shadow-2xl border border-gray-100 flex flex-col h-full transition-all duration-500 hover:-translate-y-2">
                        
                        {/* IMAGE CONTAINER */}
                        <div className="relative h-64 bg-gray-50 overflow-hidden flex items-center justify-center p-4">
                            {blog.coverImage ? (
                                <SmartImage 
                                    src={blog.coverImage} 
                                    alt={blog.title} 
                                    className="w-full h-full object-contain" 
                                />
                            ) : (
                                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs font-bold uppercase italic">
                                    No Image
                                </div>
                            )}
                            <div className="absolute top-4 right-4 w-8 h-8 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Bookmark size={14} className="text-[#d11a2a]" />
                            </div>
                        </div>

                        {/* CONTENT */}
                        <div className="p-8 flex flex-col flex-grow bg-white border-t border-gray-50">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#d11a2a]" />
                                <span className="text-[#d11a2a] text-[10px] font-black uppercase tracking-[0.2em]">
                                    {blog.category || "INDUSTRY NEWS"}
                                </span>
                            </div>

                            <h3 className="text-2xl font-black text-[#d11a2a] mb-4 uppercase italic tracking-tighter leading-tight group-hover:text-black transition-colors">
                                {blog.title}
                            </h3>

                            <p className="text-gray-400 text-sm leading-relaxed mb-8 line-clamp-2 font-medium italic">
                                {excerpt}
                            </p>

                            {/* DATE CREATED */}
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center">
                                    <Calendar size={10} className="text-gray-400" />
                                </div>
                                <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                                    {formatDate(blog.createdAt)}
                                </span>
                            </div>

                            <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between">
                                <span className="text-black font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
                                    Read Full Story 
                                    <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform text-[#d11a2a]" />
                                </span>
                            </div>
                        </div>
                    </div>
                </Link>
            </motion.div>
        );
    })}
</div>
                </div>
            </section>
            <Footer/>
        </div>
    );
}