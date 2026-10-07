"use client";

import React, { useState, useEffect } from "react";
import { SmartImage } from "@/components/ui/smart-image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { auth, db } from "@/lib/firebase"; // Added auth for logging
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import {
    ArrowRight,
    ChevronDown,
    CheckCircle2,
    Star,
    Lightbulb,
    Target,
    Zap,
    Users,
    Globe
} from "lucide-react";
import Footer from "../components/navigation/footer";
import Navbar from "../components/navigation/navbar";
import FloatingChatWidget  from "../components/chat-widget";
import FloatingMenuWidget from "../components/menu-widget";

export default function CareersPage() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedJob, setExpandedJob] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState("All");
    const [userSession, setUserSession] = useState<any>(null);

    // --- ACTIVITY LOGGER ---
    const logActivity = async (actionName: string) => {
        try {
            await addDoc(collection(db, "cmsactivity_logs"), {
                page: actionName,
                timestamp: serverTimestamp(),
                userAgent: typeof window !== "undefined" ? navigator.userAgent : "Server",
                userEmail: userSession?.email || "Anonymous Visitor",
            });
        } catch (err) {
            console.error("Log failed:", err);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => setUserSession(user));
        return () => unsubscribe();
    }, []);

    // FETCH JOBS FROM FIREBASE
    useEffect(() => {
        const q = query(collection(db, "careers"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const jobsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setJobs(jobsData.filter((job: any) => job.status === "Open"));
            setLoading(false);
        }, () => setLoading(false));
        return () => unsubscribe();
    }, []);

    const categories = ["All", ...Array.from(new Set(jobs.map(job => job.category)))];

    const benefits = [
        { icon: <Zap className="text-[#d11a2a]" />, title: "Fast-Growing and Innovative", desc: "Be at the forefront of the Philippine tech-infrastructure shift." },
        { icon: <Target className="text-[#d11a2a]" />, title: "Learn and Grow", desc: "Mentorship and hands-on training to become an industry expert." },
        { icon: <Users className="text-[#d11a2a]" />, title: "Collaborative Team Culture", desc: "Work in a dynamic, fun, and supportive environment." },
        { icon: <Lightbulb className="text-[#d11a2a]" />, title: "Driven by Sustainability and Tech", desc: "Contribute to projects that make a real impact." },
        { icon: <Star className="text-[#d11a2a]" />, title: "Competitive Compensation", desc: "We value top talent and offer excellent benefits." },
    ];

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-[#d11a2a]/10 selection:text-[#d11a2a] overflow-x-hidden">
            <Navbar />
            <FloatingMenuWidget/>

            {/* --- HERO SECTION WITH BG --- */}
            <section className="relative min-h-[70vh] flex items-center pt-32 pb-16 px-5 overflow-hidden bg-black">
                {/* Background Image with Overlay */}
                <div className="absolute inset-0 z-0">
                    <SmartImage 
                        src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop" 
                        alt="Office Background" 
                        className="w-full h-full object-cover opacity-40 scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
                </div>

                <div className="max-w-7xl mx-auto relative z-10 w-full">
                    <motion.span 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        className="text-[#d11a2a] text-[10px] md:text-[11px] font-black uppercase tracking-[0.4em] mb-4 block italic"
                    >
                        Career Opportunities
                    </motion.span>
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-6xl md:text-8xl font-black text-white tracking-tighter uppercase leading-[0.85] mb-10"
                    >
                        Join the <br /> <span className="text-[#d11a2a]">Revolution</span>
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        transition={{ delay: 0.2 }}
                        className="max-w-xl text-gray-400 font-medium text-lg leading-relaxed"
                    >
                        Build the future of lighting technology with us. We are looking for disruptors, innovators, and dreamers.
                    </motion.p>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-5 py-20">
                {/* --- CATEGORY FILTER --- */}
                <div className="flex flex-wrap gap-3 mb-12">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => {
                                setActiveCategory(cat);
                                logActivity(`Careers: Filtered by ${cat}`);
                            }}
                            className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                                activeCategory === cat ? "bg-[#d11a2a] text-white" : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    {loading ? (
                        [1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-64 w-full bg-gray-50 animate-pulse rounded-[2.5rem]" />
                        ))
                    ) : (
                        jobs
                            .filter(job => activeCategory === "All" || job.category === activeCategory)
                            .map((job) => (
                                <motion.div
                                    layout
                                    key={job.id}
                                    className={`relative rounded-[2rem] md:rounded-[2.5rem] border transition-all duration-500 h-fit ${
                                        expandedJob === job.id
                                            ? 'bg-gray-50 border-[#d11a2a] shadow-2xl z-10'
                                            : 'bg-white border-gray-100 hover:border-gray-300 hover:shadow-lg'
                                    }`}
                                >
                                    <div
                                        className="p-8 md:p-10 cursor-pointer flex flex-col gap-6"
                                        onClick={() => {
                                            const newState = expandedJob === job.id ? null : job.id;
                                            setExpandedJob(newState);
                                            if (newState) logActivity(`Careers: Viewed ${job.title}`);
                                        }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-wrap gap-2">
                                                <span className="px-3 py-1 bg-black text-white text-[9px] font-black uppercase rounded-md tracking-widest">{job.category}</span>
                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest italic">{job.jobType}</span>
                                            </div>
                                            <motion.div
                                                animate={{ rotate: expandedJob === job.id ? 180 : 0 }}
                                                className={`w-10 h-10 flex items-center justify-center rounded-full ${expandedJob === job.id ? 'bg-[#d11a2a] text-white' : 'bg-gray-50 text-gray-400'}`}
                                            >
                                                <ChevronDown size={20} />
                                            </motion.div>
                                        </div>

                                        <div>
                                            <h3 className="text-2xl md:text-3xl font-black text-gray-900 uppercase tracking-tight leading-[1.1] mb-2 group-hover:text-[#d11a2a] transition-colors">
                                                {job.title}
                                            </h3>
                                            <p className="text-gray-500 text-[13px] flex items-center gap-1.5 font-bold italic">
                                                <Globe size={14} className="text-[#d11a2a]" /> {job.location}
                                            </p>
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {expandedJob === job.id && (
                                            <motion.div 
                                                initial={{ height: 0, opacity: 0 }} 
                                                animate={{ height: "auto", opacity: 1 }} 
                                                exit={{ height: 0, opacity: 0 }} 
                                                className="overflow-hidden"
                                            >
                                                <div className="px-6 md:px-10 pb-10 pt-6 border-t border-gray-200">
                                                    <h4 className="text-[9px] font-black uppercase text-[#d11a2a] tracking-widest mb-4">Qualifications:</h4>
                                                    <ul className="space-y-3 mb-8">
                                                        {job.qualifications?.map((q: string, i: number) => (
                                                            <li key={i} className="flex gap-3 text-sm text-gray-700 font-medium leading-tight">
                                                                <CheckCircle2 size={16} className="text-[#d11a2a] shrink-0 mt-0.5" /> {q}
                                                            </li>
                                                        ))}
                                                    </ul>

                                                    <Link 
                                                        href={{
                                                            pathname: '/careers/apply',
                                                            query: { jobId: job.id, jobTitle: job.title },
                                                        }}
                                                        onClick={() => logActivity(`Careers: Clicked Apply - ${job.title}`)}
                                                        className="w-full md:w-auto bg-gray-900 text-white px-8 py-5 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-[#d11a2a] transition-all shadow-lg flex items-center justify-center gap-3"
                                                    >
                                                        Apply for this position <ArrowRight size={16} />
                                                    </Link>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            ))
                    )}
                </motion.div>
            </div>

            {/* --- BENEFITS SECTION --- */}
            <section className="py-20 md:py-32 bg-gray-50 px-5">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-100 mb-4">
                            <Star className="text-yellow-500 fill-yellow-500" size={16} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900">Why Work With Us</span>
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-gray-900 leading-[0.9]">
                            Our Culture & <span className="text-[#d11a2a]">Benefits</span>
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        {benefits.map((b, i) => (
                            <motion.div
                                whileHover={{ y: -5 }}
                                key={i}
                                className="bg-white p-8 md:p-10 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center text-center md:items-start md:text-left gap-4"
                            >
                                <div className="p-4 bg-red-50 rounded-2xl">
                                    {React.cloneElement(b.icon as React.ReactElement<any>, { size: 28 })}
                                </div>
                                <div>
                                    <h3 className="text-lg md:text-xl font-black uppercase tracking-tight text-gray-900 mb-2 leading-tight">{b.title}</h3>
                                    <p className="text-gray-500 text-sm font-medium leading-relaxed">{b.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}