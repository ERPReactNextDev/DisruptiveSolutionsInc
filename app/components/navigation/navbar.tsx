"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { auth, db } from "@/lib/firebase"; 
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, where } from "firebase/firestore"; 
import { SmartImage } from "@/components/ui/smart-image";
import {
  X,
  ArrowRight,
  ShieldCheck,
  FileSignature,
  Zap,
  User,
  LogOut,
  ChevronDown,
  Menu
} from "lucide-react";

interface Brand {
  id: string;
  title: string;
  status?: string;
  /** Slug of the brand's landing page, e.g. "zumtobel" -> /zumtobel */
  href?: string;
  website?: string;
}

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [userSession, setUserSession] = useState<any>(null);
  const [brands, setBrands] = useState<Brand[]>([]); 
  const [isProductsHovered, setIsProductsHovered] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const LOGO = "/images/disruptive.png";

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

  const navLinks = [
    { name: "Home", href: "/dashboard" },
    { name: "Products & Solutions", href: "#", hasDropdown: true }, // Changed to # because it's not clickable
    { name: "Brands", href: "/trusted-technology-brands" },
    { name: "Contact", href: "/contact-us" },
  ];

  // A brand without an `href` used to render as "/undefined", which 404'd.
  const brandHref = (brand: Brand) =>
    brand.href ? (brand.href.startsWith("/") ? brand.href : `/${brand.href}`) : "/trusted-technology-brands";

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

  // Close the mobile drawer if the viewport grows past the `lg` breakpoint.
  useEffect(() => {
    if (!isNavOpen) return;
    const mql = window.matchMedia("(min-width: 1024px)");
    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) setIsNavOpen(false);
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [isNavOpen]);

  // Dismiss the profile dropdown on outside click / Escape.
  useEffect(() => {
    if (!isUserMenuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!userMenuRef.current?.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsUserMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isUserMenuOpen]);

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
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.4 }}
              role="dialog"
              aria-modal="true"
              aria-label="Main navigation"
              className="fixed top-0 left-0 h-full w-[80%] max-w-[20rem] bg-[#0a0a0a] z-[2001] lg:hidden flex flex-col shadow-2xl"
            >
              <div className="p-8 flex items-center justify-between border-b border-white/5">
                <Link href="/" onClick={() => setIsNavOpen(false)}>
                  <SmartImage src={LOGO} alt="Disruptive Solutions Inc." width={160} height={44} priority />
                </Link>
                <button
                  type="button"
                  onClick={() => setIsNavOpen(false)}
                  aria-label="Close navigation menu"
                  className="w-10 h-10 flex items-center justify-center border border-white/10 rounded-full text-white/40 hover:text-white hover:border-white/30 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-grow py-4 px-2 overflow-y-auto">
                {navLinks.map((link, idx) => (
                  <div key={link.name}>
                    {link.hasDropdown ? (
                      <p className="group flex items-center justify-between px-6 py-5 border-b border-white/5 relative opacity-50">
                        <span className="flex items-center gap-4 relative z-10">
                          <span className="text-[10px] font-mono text-[#d11a2a]">0{idx + 1}</span>
                          <span className="text-xs font-black uppercase tracking-[0.2em] text-white">{link.name}</span>
                        </span>
                      </p>
                    ) : (
                      <Link
                        href={link.href}
                        onClick={() => {
                          setIsNavOpen(false);
                          logActivity(`Mobile Nav: ${link.name}`, link.href);
                        }}
                        className="group flex items-center justify-between px-6 py-5 border-b border-white/5 relative hover:bg-white/5 transition-colors"
                      >
                        <span className="flex items-center gap-4 relative z-10">
                          <span className="text-[10px] font-mono text-[#d11a2a]">0{idx + 1}</span>
                          <span className="text-xs font-black uppercase tracking-[0.2em] text-white">{link.name}</span>
                        </span>
                        <ArrowRight size={14} className="text-white/20 transition-colors group-hover:text-[#d11a2a]" />
                      </Link>
                    )}

                    {/* AUTO-SHOW BRANDS ON MOBILE */}
                    {link.hasDropdown && (
                      <div className="bg-white/5 py-2">
                        {brands.length === 0 ? (
                          <p className="px-10 py-4 text-[10px] font-bold uppercase tracking-widest text-white/30">
                            Loading solutions...
                          </p>
                        ) : (
                          brands.map((brand) => (
                            <Link
                              key={brand.id} 
                              href={brandHref(brand)}
                              onClick={() => setIsNavOpen(false)}
                              className="flex items-center justify-between px-10 py-4 text-[10px] font-bold uppercase tracking-widest text-white/70 hover:text-[#d11a2a] transition-colors"
                            >
                              {brand.title}
                              <ArrowRight size={12} />
                            </Link>
                          ))
                        )}
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
      <nav aria-label="Main navigation" className="fixed top-0 left-0 w-full z-[1000] py-4 transition-all duration-500">
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
              <motion.div animate={{ scale: isScrolled ? 0.85 : 1 }}>
                <SmartImage
                  src={LOGO}
                  alt="Disruptive Solutions Inc."
                  width={160}
                  height={44}
                  priority
                  className="h-10 md:h-12 w-auto object-contain transition-all duration-500"
                />
              </motion.div>
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
                {link.hasDropdown ? (
                  <button
                    type="button"
                    aria-expanded={isProductsHovered}
                    aria-haspopup="true"
                    onClick={() => setIsProductsHovered((open) => !open)}
                    onFocus={() => setIsProductsHovered(true)}
                    className={`px-5 py-2 text-[11px] font-black uppercase tracking-[0.15em] transition-all rounded-full flex items-center gap-2 ${isScrolled ? "text-gray-900" : "text-white"}`}
                  >
                    <span>{link.name}</span>
                    <ChevronDown size={12} className={`transition-transform duration-300 ${isProductsHovered ? "rotate-180" : ""}`} />
                  </button>
                ) : (
                  <Link
                    href={link.href}
                    className={`px-5 py-2 text-[11px] font-black uppercase tracking-[0.15em] transition-all rounded-full flex items-center gap-2 hover:opacity-70 ${isScrolled ? "text-gray-900" : "text-white"}`}
                  >
                    {link.name}
                  </Link>
                )}

                {/* DESKTOP DROPDOWN */}
                {link.hasDropdown && (
                  <AnimatePresence>
                    {isProductsHovered && (
                      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 15 }} className="absolute top-full left-1/2 -translate-x-1/2 pt-5">
                        <div className="bg-white rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden w-64 max-h-[70vh] overflow-y-auto p-3 ring-1 ring-black/5">
                          <p className="text-[9px] font-black text-[#d11a2a] uppercase tracking-[0.3em] px-4 py-3 opacity-40 italic">Explore Solutions</p>
                          <div className="flex flex-col gap-1">
                            {brands.length === 0 ? (
                              <p className="px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                Loading...
                              </p>
                            ) : (
                              brands.map((brand) => (
                                <Link
                                  key={brand.id}
                                  href={brandHref(brand)}
                                  onClick={() => setIsProductsHovered(false)}
                                  className="px-5 py-3.5 rounded-2xl hover:bg-gray-50 text-[11px] font-black text-black uppercase tracking-widest hover:text-[#d11a2a] transition-all flex items-center justify-between group/item"
                                >
                                  {brand.title}
                                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-all">
                                    <ArrowRight size={12} className="text-[#d11a2a]" />
                                  </div>
                                </Link>
                              ))
                            )}
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
                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    aria-haspopup="true"
                    aria-expanded={isUserMenuOpen}
                    aria-label="Open account menu"
                    onClick={() => setIsUserMenuOpen((open) => !open)}
                    className="flex items-center cursor-pointer py-2"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${isScrolled ? "border-[#d11a2a] bg-red-50" : "border-white/30 bg-white/10"}`}>
                      <User size={18} className={isScrolled ? "text-[#d11a2a]" : "text-white"} />
                    </div>
                  </button>

                  <div
                    className={`absolute top-full right-0 mt-2 w-64 transition-all duration-300 z-[1001] ${isUserMenuOpen ? "opacity-100 visible translate-y-0" : "opacity-0 invisible translate-y-2"}`}
                  >
                    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden text-left">
                      <div className="p-5 bg-gray-50 border-b border-gray-100">
                        <p className="text-[9px] font-black text-[#d11a2a] uppercase tracking-widest mb-1 italic">Active Partner</p>
                        <h4 className="text-sm font-black text-gray-900 uppercase truncate">{userSession.displayName || "Disruptive User"}</h4>
                        <p className="text-[10px] font-medium text-gray-400 truncate">{userSession.email}</p>
                      </div>
                      <div className="p-2">
                        <Link href="/portal" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-red-50 text-gray-600 hover:text-[#d11a2a] transition-colors">
                          <ShieldCheck size={16} /><span className="text-[10px] font-black uppercase tracking-widest">Client Portal</span>
                        </Link>
                        <button type="button" onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-gray-900 hover:text-white text-gray-400 transition-all">
                          <LogOut size={16} /><span className="text-[10px] font-black uppercase tracking-widest">Sign Out</span>
                        </button>
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

          <button
            type="button"
            className="lg:hidden p-2 relative z-[1001] -mr-2 rounded-md"
            aria-label="Open navigation menu"
            aria-expanded={isNavOpen}
            onClick={() => setIsNavOpen(true)}
          >
            <Menu size={24} className={isScrolled ? "text-black" : "text-white"} />
          </button>
        </div>
      </nav>
    </>
  );
}