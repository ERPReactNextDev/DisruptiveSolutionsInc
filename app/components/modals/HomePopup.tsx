"use client";

import React, { useState, useEffect } from "react";
import { SmartImage } from "@/components/ui/smart-image";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

export default function HomePopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    const docRef = doc(db, "cms_settings", "home_popup");
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setConfig(data);
        
        if (data.isActive) {
          const POPUP_INTERVAL = 10 * 60 * 1000; 
          const lastShown = localStorage.getItem("last_popup_time");
          const currentTime = Date.now();

          if (!lastShown || currentTime - parseInt(lastShown) > POPUP_INTERVAL) {
            const timer = setTimeout(() => {
              setIsOpen(true);
              localStorage.setItem("last_popup_time", currentTime.toString());
            }, 3000);
            return () => clearTimeout(timer);
          }
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const closePopup = () => setIsOpen(false);

  if (!config) return null;

  const getAlignmentClasses = () => {
    switch (config.alignment) {
      case "left": return "justify-start md:pl-12";
      case "right": return "justify-end md:pr-12";
      default: return "justify-center";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && config.isActive && (
        <div className={`fixed inset-0 z-[99999] flex items-center p-6 pointer-events-none ${getAlignmentClasses()}`}>
          
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={closePopup}
            className="absolute inset-0 bg-black/85 backdrop-blur-md pointer-events-auto cursor-crosshair"
          />

          <motion.div
            initial={{ 
              opacity: 0, 
              scale: 0.9,
              y: 20
            }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-full max-w-[420px] bg-white border-[3px] border-black rounded-[48px] overflow-hidden shadow-2xl pointer-events-auto"
          >
            {/* BIG IMAGE SECTION (70% ng Height) */}
            <div className="h-[400px] bg-gray-50 relative group overflow-hidden border-b-[3px] border-black">
              {config.imageUrl ? (
                <SmartImage 
                  src={config.imageUrl} 
                  alt="Product Highlight" 
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                   <Zap size={80} className="text-black/10 fill-black/10" />
                </div>
              )}
              


              {/* CLEAN CLOSE BUTTON */}
              <button 
                onClick={closePopup}
                className="absolute top-8 right-8 w-12 h-12 bg-black text-white rounded-full flex items-center justify-center hover:bg-[#d11a2a] transition-all"
              >
                <X size={24} strokeWidth={2.5} />
              </button>
            </div>

            {/* MINIMAL CONTENT SECTION */}
            <div className="p-8 bg-white text-center">
              <div className="mb-6">
                <h2 className="text-3xl font-black uppercase italic leading-none text-black mb-2 tracking-tighter">
                  {config.title || "Next Gen Gear"}
                </h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">
                  {config.subtitle || "Engineered for high-performance"}
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Link 
                  href={config.link || "/lighting-products-smart-solutions"}
                  onClick={closePopup}
                  className="w-full bg-black text-white py-5 rounded-[24px] font-black uppercase text-[12px] tracking-widest hover:bg-[#d11a2a] transition-all flex items-center justify-center gap-3 group border-2 border-black active:translate-y-1"
                >
                  Shop Now <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                
                <button 
                  onClick={closePopup} 
                  className="py-2 text-[9px] font-black uppercase tracking-[0.5em] text-gray-300 hover:text-black transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </div>

            {/* BOTTOM DECO */}
            <div className="h-2 w-full bg-black" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}