"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { auth, db } from "@/lib/firebase"; 
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, where } from "firebase/firestore"; 
import {
  X,
  ArrowRight,
  ShieldCheck,
  FileSignature,
  Zap,
  User,
  LogOut,
  ChevronDown
} from "lucide-react";

interface Brand {
  id: string;
  title: string;
  status?: string;
  website: string;
  // ... iba pang fields
}
export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [userSession, setUserSession] = useState<any>(null);
  const [brands, setBrands] = useState<any[]>([]); 
  const [isProductsHovered, setIsProductsHovered] = useState(false);
// --- FETCH BRANDS FROM FIRESTORE (FILTERED BY WEBSITE) ---
useEffect(() => {
  // Query para makuha lang ang para sa website na ito
  const q = query(
    collection(db, "brand_name"), 
    where("website", "==", "Disruptive Solutions Inc"),
    orderBy("title", "asc")
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    // 1. I-map ang docs at i-cast as Brand interface
    const allBrands: Brand[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<Brand, 'id'>)
    }));

    // 2. Client-side filter: Tanggalin ang mga brands na "soon" ang status
    const activeBrands = allBrands.filter(brand => brand.status !== "soon");

    // 3. I-set ang state gamit ang sinalang data
    setBrands(activeBrands);
  });

  return () => unsubscribe();
}, []);

  const logActivity = async (actionName: string, targetPath?: string) => {
    if (typeof window !== "undefined" && targetPath) {
      const currentPath = window.location.pathname;
      if (currentPath === targetPath) return;
    }
    try {
      await addDoc(collection(db, "cmsactivity_logs"), {
        page: actionName,
        timestamp: serverTimestamp(),
        userAgent: typeof window !== "undefined" ? navigator.userAgent : "Server",
        userEmail: userSession?.email || "Anonymous Guest", 
      });
    } catch (err) {
      console.error("Logging failed:", err);
    }
  };

  const LOGO_RED = "images/disruptive.png";
  const LOGO_WHITE = "images/disruptive.png";

  const navLinks = [
    { name: "Home", href: "/dashboard" },
    { name: "Products & Solutions", href: "#", hasDropdown: true }, // Changed to # because it's not clickable
    { name: "Brands", href: "/trusted-technology-brands" },
    { name: "Contact", href: "/contact-us" },
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserSession(user ? user : null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await logActivity("User Signed Out"); 
    await signOut(auth);
    localStorage.removeItem("disruptive_user_session");
    window.location.reload();
  };

  return (
    <>
      {/* --- MOBILE NAVIGATION --- */}
      <AnimatePresence>
        {isNavOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsNavOpen(false)} className="fixed inset-0 bg-black/40 backdrop-blur-md z-[2000] lg:hidden" />
            <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "tween", duration: 0.4 }} className="fixed top-0 left-0 h-full w-[80%] bg-[#0a0a0a] z-[2001] lg:hidden flex flex-col shadow-2xl">
              <div className="p-8 flex items-center justify-between border-b border-white/5">
                <img src={LOGO_WHITE} alt="Logo" className="h-11 w-auto" />
                <button onClick={() => setIsNavOpen(false)} className="w-10 h-10 flex items-center justify-center border border-white/10 rounded-full text-white/40"><X size={20} /></button>
              </div>

              <div className="flex-grow py-4 px-2 overflow-y-auto">
                {navLinks.map((link, idx) => (
                  <div key={link.name}>
                    <Link 
                      href={link.href} 
                      onClick={(e) => {
                        if (link.hasDropdown) e.preventDefault(); // Prevent click on mobile for the parent
                        else { setIsNavOpen(false); logActivity(`Mobile Nav: ${link.name}`, link.href); }
                      }} 
                      className={`group flex items-center justify-between px-6 py-5 border-b border-white/5 relative ${link.hasDropdown ? 'pointer-events-none opacity-50' : ''}`}
                    >
                      <div className="flex items-center gap-4 relative z-10">
                        <span className="text-[10px] font-mono text-[#d11a2a]">0{idx + 1}</span>
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-white">{link.name}</span>
                      </div>
                      {!link.hasDropdown && <ArrowRight size={14} className="text-white/20" />}
                    </Link>

                    {/* AUTO-SHOW BRANDS ON MOBILE */}
                    {link.hasDropdown && (
                      <div className="bg-white/5 py-2">
                        {brands.map((brand) => (
                          <Link 
                            key={brand.id} 
                            href={`/${brand.href}`}
                            onClick={() => setIsNavOpen(false)}
                            className="flex items-center justify-between px-10 py-4 text-[10px] font-bold uppercase tracking-widest text-white/70 hover:text-[#d11a2a]"
                          >
                            {brand.title}
                            <ArrowRight size={12} />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* INTERNAL SYSTEMS MOBILE */}
                {userSession && (
                  <div className="mt-8 px-6 space-y-4">
                    <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.4em]">Internal Systems</p>
                    <div className="grid gap-2">
                      <Link href="/catalog" onClick={() => setIsNavOpen(false)} className="flex items-center gap-3 text-[10px] font-bold text-white/70 uppercase tracking-widest hover:text-[#d11a2a]">
                        <FileSignature size={14} /> Catalog
                      </Link>
                      <Link href="/portal" onClick={() => setIsNavOpen(false)} className="flex items-center gap-3 text-[10px] font-bold text-white/70 uppercase tracking-widest hover:text-[#d11a2a]">
                        <ShieldCheck size={14} /> Client Portal
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-white/5 bg-white/[0.02]">
                <Link href="/quote" onClick={() => setIsNavOpen(false)} className="flex items-center justify-between group">
                  <span className="text-[11px] font-black uppercase tracking-widest text-white">Start a Project</span>
                  <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-[#d11a2a] transition-all">
                    <Zap size={14} className="text-white fill-white" />
                  </div>
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- DESKTOP NAVIGATION --- */}
      <nav className="fixed top-0 left-0 w-full z-[1000] py-4 transition-all duration-500">
        <motion.div
          animate={{
            backgroundColor: isScrolled ? "rgba(255, 255, 255, 0.95)" : "rgba(255, 255, 255, 0)",
            backdropFilter: isScrolled ? "blur(20px)" : "blur(0px)",
            height: isScrolled ? "70px" : "90px",
          }}
          className="absolute inset-0 transition-all duration-500"
        />

        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between relative z-10 h-full">
          <div className="relative shrink-0">
            <Link href="/" onClick={() => logActivity("Navigation: Logo Home", "/")}>
              <motion.img animate={{ scale: isScrolled ? 0.85 : 1 }} src={isScrolled ? LOGO_RED : LOGO_WHITE} alt="Logo" className="h-10 md:h-12 w-auto object-contain transition-all duration-500" />
            </Link>
          </div>

          <motion.div
            animate={{ backgroundColor: isScrolled ? "rgba(0, 0, 0, 0.05)" : "rgba(255, 255, 255, 0.15)" }}
            className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center py-1.5 rounded-full border border-white/10"
          >
            {navLinks.map((link) => (
              <div 
                key={link.name} 
                className="relative group"
                onMouseEnter={() => link.hasDropdown && setIsProductsHovered(true)}
                onMouseLeave={() => link.hasDropdown && setIsProductsHovered(false)}
              >
                <Link
                  href={link.href}
                  className={`px-5 py-2 text-[11px] font-black uppercase tracking-[0.15em] transition-all rounded-full flex items-center gap-2 ${isScrolled ? "text-gray-900" : "text-white"} ${link.hasDropdown ? 'pointer-events-none' : ''}`}
                >
                  <span className="relative z-10">{link.name}</span>
                  {link.hasDropdown && <ChevronDown size={12} className={`transition-transform duration-300 ${isProductsHovered ? "rotate-180" : ""}`} />}
                </Link>

                {/* DESKTOP DROPDOWN */}
                {link.hasDropdown && (
                  <AnimatePresence>
                    {isProductsHovered && (
                      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 15 }} className="absolute top-full left-1/2 -translate-x-1/2 pt-5">
                        <div className="bg-white rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden w-64 p-3 ring-1 ring-black/5">
                          <p className="text-[9px] font-black text-[#d11a2a] uppercase tracking-[0.3em] px-4 py-3 opacity-40 italic">Explore Solutions</p>
                          <div className="flex flex-col gap-1">
                            {brands.map((brand) => (
                              <Link
                                key={brand.id}
                                href={`/${brand.href}`}
                                onClick={() => setIsProductsHovered(false)}
                                className="px-5 py-3.5 rounded-2xl hover:bg-gray-50 text-[11px] font-black text-black uppercase tracking-widest hover:text-[#d11a2a] transition-all flex items-center justify-between group/item"
                              >
                                {brand.title}
                                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-all">
                                  <ArrowRight size={12} className="text-[#d11a2a]" />
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            ))}
          </motion.div>

          <div className="hidden lg:flex items-center gap-4">
            {userSession && (
              <div className="flex items-center gap-4 pl-4 border-l border-white/10">
                <Link href="/catalog" className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest border-2 transition-all ${isScrolled ? "border-gray-200 text-gray-900 hover:bg-gray-100" : "border-white/20 text-white hover:bg-white/10"}`}>
                  Catalog
                </Link>
                
                {/* USER PROFILE DROPDOWN */}
                <div className="relative group">
                  <div className="flex items-center cursor-pointer py-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${isScrolled ? "border-[#d11a2a] bg-red-50" : "border-white/30 bg-white/10"}`}>
                      <User size={18} className={isScrolled ? "text-[#d11a2a]" : "text-white"} />
                    </div>
                    <div className="absolute top-full right-0 mt-2 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-[1001]">
                      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden text-left">
                        <div className="p-5 bg-gray-50 border-b border-gray-100">
                          <p className="text-[9px] font-black text-[#d11a2a] uppercase tracking-widest mb-1 italic">Active Partner</p>
                          <h4 className="text-sm font-black text-gray-900 uppercase truncate">{userSession.displayName || "Disruptive User"}</h4>
                          <p className="text-[10px] font-medium text-gray-400 truncate">{userSession.email}</p>
                        </div>
                        <div className="p-2">
                          <Link href="/portal" className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-red-50 text-gray-600 hover:text-[#d11a2a] transition-colors">
                            <ShieldCheck size={16} /><span className="text-[10px] font-black uppercase tracking-widest">Client Portal</span>
                          </Link>
                          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-gray-900 hover:text-white text-gray-400 transition-all">
                            <LogOut size={16} /><span className="text-[10px] font-black uppercase tracking-widest">Sign Out</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <Link href="/quote" className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-xl ${isScrolled ? "bg-[#d11a2a] text-white shadow-red-500/20" : "bg-white text-gray-900 shadow-white/10"}`}>
              Free Quote
            </Link>
          </div>

          <button className="lg:hidden p-2 relative z-[1001]" onClick={() => setIsNavOpen(true)}>
            <div className="space-y-1.5">
              <div className={`w-6 h-0.5 transition-all ${isScrolled ? "bg-black" : "bg-white"}`}></div>
              <div className={`w-4 h-0.5 transition-all ${isScrolled ? "bg-[#d11a2a]" : "bg-white/60"}`}></div>
            </div>
          </button>
        </div>
      </nav>
    </>
  );
}