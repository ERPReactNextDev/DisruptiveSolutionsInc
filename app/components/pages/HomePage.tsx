"use client";

import React, { useState, useEffect, useRef } from "react";
import { SmartImage } from "@/components/ui/smart-image";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { 
  Save, Layout, AlignLeft, AlignCenter, AlignRight, 
  Image as ImageIcon, Power, Upload, Loader2, Globe, Eye,
  Sparkles, MousePointer2, Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { uploadToCloudinary } from "@/lib/cloudinary";

export default function CMSAdmin() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [config, setConfig] = useState({
    title: "",
    subtitle: "",
    imageUrl: "",
    alignment: "center",
    isActive: false,
    link: "/lighting-products-smart-solutions"
  });

  useEffect(() => {
    const fetchConfig = async () => {
      const docRef = doc(db, "cms_settings", "home_popup");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setConfig(docSnap.data() as any);
      }
      setLoading(false);
    };
    fetchConfig();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const remoteUrl = await uploadToCloudinary(file);
      if (remoteUrl) {
        setConfig(prev => ({ ...prev, imageUrl: remoteUrl }));
      }
    } catch (error) {
      console.error("Cloudinary Error:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const docRef = doc(db, "cms_settings", "home_popup");
      await setDoc(docRef, {
        ...config,
        lastUpdated: serverTimestamp(),
      }, { merge: true });
      alert("Popup Config Synchronized! âš¡");
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="h-screen bg-white flex flex-col items-center justify-center gap-4">
      <Zap className="animate-bounce text-[#d11a2a]" size={40} />
      <span className="text-[10px] font-black uppercase tracking-[0.5em] animate-pulse">Initializing Studio...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fafafa] text-black p-4 md:p-12 font-sans selection:bg-[#d11a2a] selection:text-white">
      <div className="max-w-6xl mx-auto">
        
        {/* TOP BAR NAVIGATION */}
        <header className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-3 mb-2 text-[#d11a2a]">
              <Sparkles size={16} />
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">Marketing Engine</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-none">
              Popup <span className="text-gray-200 not-italic font-light">Studio</span>
            </h1>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={saving || uploading}
            className="group relative flex items-center justify-center gap-4 bg-black text-white px-10 py-5 rounded-full font-black uppercase text-[12px] tracking-widest disabled:opacity-50 overflow-hidden"
          >
            <div className="absolute inset-0 bg-[#d11a2a] translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <span className="relative z-10 flex items-center gap-3">
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} 
              {saving ? "Syncing..." : "Push to Live"}
            </span>
          </motion.button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* EDITOR SECTION */}
          <div className="lg:col-span-7 space-y-10">
            
            {/* STATUS SELECTOR */}
            <section>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 ml-2">Configuration</h3>
              <div className={`p-8 rounded-[40px] border-2 transition-all duration-500 ${config.isActive ? "bg-white border-black shadow-[20px_20px_0px_0px_rgba(0,0,0,0.05)]" : "bg-gray-100 border-transparent opacity-60"}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-black uppercase italic text-xl">Visibility Status</h4>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Toggle popup appearance on homepage</p>
                  </div>
                  <button
                    onClick={() => setConfig({ ...config, isActive: !config.isActive })}
                    className={`w-20 h-10 rounded-full transition-all p-1 ${config.isActive ? "bg-[#d11a2a]" : "bg-gray-300"}`}
                  >
                    <div className={`w-8 h-8 bg-white rounded-full shadow-lg transition-transform duration-300 ${config.isActive ? "translate-x-10" : "translate-x-0"}`} />
                  </button>
                </div>
              </div>
            </section>

            {/* ASSET UPLOAD */}
            <section className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 ml-2">Visual Content</h3>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="group relative aspect-video w-full bg-white border-2 border-black rounded-[40px] overflow-hidden cursor-pointer shadow-[10px_10px_0px_0px_rgba(209,26,42,0.1)] hover:shadow-none transition-all"
              >
                {config.imageUrl ? (
                  <>
                    <SmartImage src={config.imageUrl} alt="Product image" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white backdrop-blur-sm">
                      <Upload size={32} strokeWidth={3} className="mb-2" />
                      <span className="text-xs font-black uppercase tracking-widest">Replace Asset</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-4">
                    <div className="p-6 bg-gray-50 rounded-full group-hover:bg-[#d11a2a] group-hover:text-white transition-colors">
                      {uploading ? <Loader2 className="animate-spin" /> : <ImageIcon size={32} />}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">Select Product Highlight</span>
                  </div>
                )}
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
              </div>
            </section>

            {/* INPUTS GRID */}
            <section className="grid md:grid-cols-2 gap-6">
              <div className="space-y-6">
                 <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-4 mb-2 block">Headline</label>
                    <input 
                      type="text" 
                      placeholder="E.G. NEW ARRIVAL"
                      value={config.title}
                      onChange={(e) => setConfig({...config, title: e.target.value})}
                      className="w-full bg-white border-2 border-gray-100 focus:border-black rounded-3xl px-6 py-4 text-sm font-bold uppercase outline-none transition-all shadow-sm"
                    />
                 </div>
                 <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-4 mb-2 block">Description</label>
                    <input 
                      type="text" 
                      placeholder="SHORT PROMO TEXT..."
                      value={config.subtitle}
                      onChange={(e) => setConfig({...config, subtitle: e.target.value})}
                      className="w-full bg-white border-2 border-gray-100 focus:border-black rounded-3xl px-6 py-4 text-sm font-bold uppercase outline-none transition-all shadow-sm"
                    />
                 </div>
              </div>

              <div className="bg-black rounded-[40px] p-8 text-white flex flex-col justify-between">
                <div>
                  <Layout size={20} className="mb-4 text-[#d11a2a]" />
                  <h4 className="text-sm font-black uppercase tracking-tighter italic">Alignment Logic</h4>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-6">
                  {["left", "center", "right"].map((pos) => (
                    <button
                      key={pos}
                      onClick={() => setConfig({ ...config, alignment: pos })}
                      className={`h-12 flex items-center justify-center rounded-2xl transition-all border ${
                        config.alignment === pos ? "bg-white text-black border-white" : "bg-transparent text-gray-500 border-gray-800 hover:border-gray-600"
                      }`}
                    >
                      {pos === 'left' && <AlignLeft size={18} />}
                      {pos === 'center' && <AlignCenter size={18} />}
                      {pos === 'right' && <AlignRight size={18} />}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* REAL-TIME PREVIEW (STAMP STYLE) */}
          <div className="lg:col-span-5 relative">
            <div className="sticky top-12">
              <div className="flex items-center justify-between mb-4 px-4">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 flex items-center gap-2">
                  <Eye size={14} /> Live Simulation
                </span>
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <div className="w-2 h-2 rounded-full bg-yellow-400" />
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                </div>
              </div>

              <div className="aspect-[4/5] bg-[#111] rounded-[60px] shadow-2xl overflow-hidden relative group p-8 flex items-center justify-center border-[8px] border-white">
                {/* Simulated Web Content */}
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                  <div className="grid grid-cols-2 gap-4 p-8">
                    {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-800 rounded-2xl" />)}
                  </div>
                </div>

                {/* THE POPUP SIMULATION */}
                <AnimatePresence mode="wait">
                  {config.isActive && (
                    <motion.div
                      key="preview"
                      initial={{ 
                        opacity: 0, 
                        x: config.alignment === "left" ? -50 : config.alignment === "right" ? 50 : 0,
                        y: config.alignment === "center" ? 50 : 0,
                        scale: 0.9
                      }}
                      animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="relative z-10 w-full max-w-[300px] bg-white rounded-[32px] overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] border border-gray-100"
                    >
                      <div className="aspect-square bg-gray-100 relative overflow-hidden">
                        {config.imageUrl ? (
                          <SmartImage src={config.imageUrl} alt="Product image" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-200 uppercase font-black italic text-4xl">Image</div>
                        )}
                        <div className="absolute top-4 right-4 w-8 h-8 bg-black/10 backdrop-blur-md rounded-full flex items-center justify-center text-xs">âœ•</div>
                      </div>
                      <div className="p-8 text-center">
                        <h4 className="font-black uppercase italic text-2xl leading-none mb-2 tracking-tighter">
                          {config.title || "Headline Here"}
                        </h4>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-6">
                          {config.subtitle || "Your sub-description goes here"}
                        </p>
                        <button className="w-full py-4 bg-black text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2">
                          View Gear <MousePointer2 size={12} />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!config.isActive && (
                  <div className="relative z-10 text-center">
                    <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest px-8 py-4 border border-gray-800 rounded-full">Popup is currently disabled</p>
                  </div>
                )}
              </div>
              
              <div className="mt-8 flex justify-center">
                 <div className="px-6 py-3 bg-white border border-gray-100 rounded-full shadow-sm flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${config.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                      <span className="text-[9px] font-black uppercase text-gray-500">System Ready</span>
                    </div>
                    <div className="w-px h-4 bg-gray-100" />
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter italic">V.2.0 DISRUPTIVE_POPUP</span>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
