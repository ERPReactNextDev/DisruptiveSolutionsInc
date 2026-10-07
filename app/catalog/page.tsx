"use client";

import React, { useState, useEffect } from "react";
import { SmartImage } from "@/components/ui/smart-image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Search,
  Image as ImageIcon,
  X,
  MailCheck,
  CheckCircle2,
  Loader2,
  Download,
  FileText
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from "firebase/firestore";
import Footer from "../components/navigation/footer";
import Navbar from "../components/navigation/navbar";
import FloatingChatWidget  from "../components/chat-widget";
import FloatingMenuWidget from "../components/menu-widget";

export default function CatalogPage() {
  const [catalogs, setCatalogs] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCatalog, setSelectedCatalog] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "catalogs"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCatalogs(docs);
      setLoadingData(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredCatalogs = catalogs.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

const handleRequestAccess = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);

  try {
    // 1. Save request to Firestore
    await addDoc(collection(db, "catalog_requests"), {
      requesterName: formData.name,
      requesterEmail: formData.email,
      catalogTitle: selectedCatalog.title,
      catalogId: selectedCatalog.id,
      status: "downloaded",
      requestedAt: serverTimestamp(),
    });

    // 2. Trigger Email API
    await fetch("/api/catalog-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.name,
        email: formData.email,
        catalogTitle: selectedCatalog.title,
      }),
    });

    // 3. THE "REAL" PDF DOWNLOAD FIX (ANTI-WEBP LOGIC)
    if (selectedCatalog.pdfUrl) {
      /**
       * STEP A: CLEAN THE URL
       * 1. Tinatanggal ang 'f_auto,q_auto' (Ang salarin kung bakit nagiging WebP)
       * 2. In-iinject ang 'fl_attachment' para pilitin ang download.
       */
      const forcePdfUrl = selectedCatalog.pdfUrl
        .replace("/f_auto,q_auto/", "/") // Tanggal ang auto-format optimization
        .replace("/upload/", "/upload/fl_attachment/");

      const fileName = `${selectedCatalog.title.replace(/\s+/g, '_')}.pdf`;

      // STEP B: Create temporary anchor for direct download
      // Ginagamit natin ito para hindi ma-corrupt ng browser preview ang file data.
      const link = document.createElement('a');
      link.href = forcePdfUrl;
      link.setAttribute('download', fileName);
      link.setAttribute('target', '_self'); // Siguradong stay on page

      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);
    }

    setIsSuccess(true);
  } catch (error) {
    console.error("Error:", error);
    alert("Something went wrong. Please try again.");
  } finally {
    setIsSubmitting(false);
  }
};

  const handleCloseModal = () => {
    setSelectedCatalog(null);
    setFormData({ name: "", email: "" });
    setIsSuccess(false);
  };

  return (
    <div className="min-h-screen relative selection:bg-[#d11a2a]/30 selection:text-white">
      <FloatingMenuWidget/>
      {/* BACKGROUND LAYER */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://disruptivesolutionsinc.com/wp-content/uploads/2025/10/ABOUT-US-PAGE-HERO.png')`,
        }}
      >
        <div className="absolute inset-0 bg-black/85 backdrop-blur-[2px]" />
      </div>

      <AnimatePresence>
        {selectedCatalog && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-[#111] w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl p-8 md:p-10 border border-white/10"
            >
              {!isSuccess ? (
                <>
                  <button onClick={handleCloseModal} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors">
                    <X size={20} />
                  </button>
                  <div className="mb-8 text-center md:text-left">
                    <div className="w-12 h-12 bg-[#d11a2a]/20 rounded-2xl flex items-center justify-center text-[#d11a2a] mb-6 mx-auto md:mx-0">
                      <FileText size={24} />
                    </div>
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">Access Specification</h2>
                    <p className="text-[#d11a2a] text-[10px] font-bold uppercase mt-2 tracking-widest">Format: High-Res JPG | {selectedCatalog.title}</p>
                  </div>

                  <form onSubmit={handleRequestAccess} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Full Name</label>
                      <input required type="text" placeholder="Your Name" className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 outline-none focus:border-[#d11a2a] font-bold text-sm text-white transition-all placeholder:text-gray-600" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Work Email</label>
                      <input required type="email" placeholder="email@company.com" className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 outline-none focus:border-[#d11a2a] font-bold text-sm text-white transition-all placeholder:text-gray-600" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                    <button disabled={isSubmitting} type="submit" className="w-full bg-[#d11a2a] text-white py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl hover:bg-white hover:text-black transition-all flex items-center justify-center gap-3 mt-4 disabled:opacity-50">
                      {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <>Unlock & Download <Download size={16} /></>}
                    </button>
                  </form>
                </>
              ) : (
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="py-10 flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 size={40} />
                  </div>
                  <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-2 text-white">Starting Download</h2>
                  <p className="text-gray-400 text-sm font-medium mb-8 max-w-[280px]">
                    Thank you, {formData.name.split(' ')[0]}. The technical image for <strong>{selectedCatalog.title}</strong> is being saved to your device.
                  </p>
                  
                  {/* UPDATE: Restart link points to transformed JPG */}
                  <a 
                    href={selectedCatalog.pdfUrl.replace(".pdf", ".jpg").replace("/upload/", "/upload/f_jpg,fl_attachment,pg_1/")} 
                    download 
                    className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-[#d11a2a] hover:text-white transition-all"
                  >
                    Restart Download <Download size={18} />
                  </a>
                  <button onClick={handleCloseModal} className="mt-6 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white">Back to Archives</button>
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="relative z-10">
        <Navbar />
        <main className="max-w-7xl mx-auto px-6 pt-32 pb-32">
          <header className="mb-11">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div>
                <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter italic">
                  The <span className="text-[#d11a2a]">Archives</span>
                </h1>
                <p className="mt-4 text-gray-300 max-w-md font-medium leading-relaxed">
                  Log your identity to instantly download high-fidelity technical specifications.
                </p>
              </div>
            </div>
          </header>

          {loadingData ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="animate-spin text-[#d11a2a]" size={40} />
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Syncing Vault...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
              <AnimatePresence mode="popLayout">
                {filteredCatalogs.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group bg-black/40 backdrop-blur-sm rounded-[24px] md:rounded-[32px] overflow-hidden border border-white/10 hover:border-[#d11a2a]/50 transition-all duration-500"
                  >
                    <div className="relative h-44 md:h-64 overflow-hidden">
                      <SmartImage src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-100" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent flex items-end p-4 md:p-8">
                        <span className="text-white/80 text-[8px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                          <ImageIcon size={12} /> {item.category}
                        </span>
                      </div>
                    </div>
                    <div className="p-4 md:p-8">
                      <h3 className="text-sm md:text-xl font-black text-white uppercase tracking-tight mb-2 truncate">{item.title}</h3>
                      <p className="text-gray-400 text-[10px] md:text-sm leading-relaxed mb-4 md:mb-6 font-medium line-clamp-2">{item.description}</p>
                      <button onClick={() => setSelectedCatalog(item)} className="flex items-center justify-between w-full bg-white/10 group-hover:bg-[#d11a2a] px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl transition-all duration-300">
                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-white italic">Download Spec</span>
                        <Download size={14} className="text-[#d11a2a] group-hover:text-white" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </main>
        <Footer />
      </div>
    </div>
  );
}