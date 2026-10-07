"use client";

import React, { useState, useEffect } from "react";
import { SmartImage } from "@/components/ui/smart-image";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ChevronRight, Home, Plus, ChevronLeft } from "lucide-react";
import Footer from "../components/navigation/footer";
import Link from "next/link";

export default function ProjectGalleryPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 32; // 4 columns x 8 rows

  useEffect(() => {
    const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // CALCULATE PAGINATION
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = projects.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(projects.length / itemsPerPage);

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-[#d11a2a]" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfc] relative">
      {/* Background Grid */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.3] z-0" 
        style={{ backgroundImage: `linear-gradient(to right, #e5e7eb 1px, transparent 1px), linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)`, backgroundSize: '40px 40px' }} 
      />

      <div className="relative z-10">
        <section className="max-w-[1600px] mx-auto px-6 md:px-12 pt-12 pb-10">
          <nav className="flex items-center gap-2 mb-8 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
            <Link href="/" className="flex items-center gap-1 hover:text-[#d11a2a] transition-colors">
              <Home size={12} /> Home
            </Link>
            <ChevronRight size={12} />
            <span className="text-black">Projects</span>
          </nav>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
            <h2 className="text-[#d11a2a] text-[11px] font-black uppercase tracking-[0.4em]">Full Portfolio</h2>
            <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter">
              Featured <span className="text-[#d11a2a]">Projects</span>
            </h1>
          </motion.div>
        </section>

{/* GRID SECTION - 4 COLUMNS ON DESKTOP */}
<section className="max-w-[1800px] mx-auto px-6 md:px-16 lg:px-24 pb-20">
  {/* Dagdag na margin gap sa columns para hindi dikit-dikit */}
  <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">
    <AnimatePresence mode="popLayout">
      {currentItems.map((project) => (
        <motion.div
          layout
          key={project.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.4 }}
          className="group relative bg-white rounded-[24px] md:rounded-[40px] overflow-hidden shadow-sm border border-gray-100 flex flex-col h-full"
        >
          {/* IMAGE CONTAINER */}
          <div className="relative aspect-[4/5] overflow-hidden bg-gray-50">
            <SmartImage 
              src={project.imageUrl} 
              alt={project.title} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
            />
            
            {/* HOVER OVERLAY */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center p-6 text-center">
              {project.logoUrl && (
                <SmartImage 
                  src={project.logoUrl} 
                  className="w-32 h-24 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] mb-4" 
                />
              )}
              {/* Optional: Add a button or indicator here if needed */}
            </div>
          </div>

          {/* BOTTOM TEXT - Mas malapad na padding para sa premium look */}
          <div className="p-6 md:p-8 bg-white flex-grow">
            <h3 className="text-[11px] md:text-sm font-black uppercase tracking-tight text-gray-900 line-clamp-2 leading-tight">
              {project.title}
            </h3>
            <div className="h-px w-8 bg-red-100 my-3 group-hover:w-12 transition-all duration-500" />
            <p className="text-[8px] md:text-[10px] text-gray-400 font-bold uppercase tracking-widest truncate italic">
              {project.description || "Architectural Lighting"}
            </p>
          </div>
        </motion.div>
      ))}
    </AnimatePresence>
  </div>

  {/* --- PAGINATION CONTROLS --- */}
  {totalPages > 1 && (
    <div className="flex flex-col items-center gap-6 mt-24">
      <div className="flex items-center gap-3">
        {/* Previous Button */}
        <button
          onClick={() => paginate(currentPage - 1)}
          disabled={currentPage === 1}
          className="w-14 h-14 rounded-full border-2 border-gray-100 flex items-center justify-center hover:bg-black hover:border-black hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft size={20} />
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-3">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
            <button
              key={number}
              onClick={() => paginate(number)}
              className={`w-14 h-14 rounded-full text-xs font-black transition-all border-2 ${
                currentPage === number 
                ? "bg-[#d11a2a] border-[#d11a2a] text-white shadow-xl shadow-red-100" 
                : "bg-white border-gray-100 text-gray-400 hover:border-black hover:text-black"
              }`}
            >
              {number}
            </button>
          ))}
        </div>

        {/* Next Button */}
        <button
          onClick={() => paginate(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="w-14 h-14 rounded-full border-2 border-gray-100 flex items-center justify-center hover:bg-black hover:border-black hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-black">
          Page {currentPage} of {totalPages}
        </span>
        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-300">
          Showing {currentItems.length} of {projects.length} Total Projects
        </span>
      </div>
    </div>
  )}
</section>

        <Footer />
      </div>
    </div>
  );
}