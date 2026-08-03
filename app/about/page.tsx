"use client";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useState, useEffect } from "react";
import Link from "next/link";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  limit,
  where,
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  Zap,
  Lightbulb,
  Target,
  ArrowRight,
  ChevronUp,
  Check,
  Facebook,
  Linkedin,
  Twitter,
  X,
  ShieldCheck,
  FileSignature,
  User,
  LogOut,
  Wrench,
  HeadphonesIcon,
  PhoneCall,
  CheckCircle2,
} from "lucide-react";
import SignUpNewsletter from "../components/SignUpNewsletter";
import Footer from "../components/navigation/footer";
import FloatingChatWidget from "../components/chat-widget";
import FloatingMenuWidget from "../components/menu-widget";

export default function DisruptiveLandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [userSession, setUserSession] = useState<any>(null);
  const LOGO_RED = "/disruptive.png";
  const LOGO_WHITE = "/disruptive.png";

  const navLinks = [
    { name: "Home", href: "/" },
    {
      name: "Products & Solutions",
      href: "/lighting-products-smart-solutions",
    },
    { name: "Brands", href: "/trusted-technology-brands" },
    { name: "Contact Us", href: "/contact-us" },
  ];

  const footerLinks = [
    { name: "About Us", href: "/about" },
    { name: "Blog", href: "/blog" },
    { name: "Careers", href: "/careers" },
    { name: "Contact Us", href: "/contact-us" },
  ];

  const brandData = [
    {
      category: "Smart Lighting",
      title: "Zumtobel's Lighting Solutions",
      description:
        "Global leader in premium lighting solutions, combines design, innovation and sustainability.",
      image:
        "https://disruptivesolutionsinc.com/wp-content/uploads/2025/11/ZUMTOBELs.png",
      href: "/zumtobel-lighting-solutions",
    },
    {
      category: "Power Solutions",
      title: "Affordable Lighting That Works as Hard as You Do",
      description:
        "Smart lighting at smarter prices - reliable quality without compromise",
      image:
        "https://disruptivesolutionsinc.com/wp-content/uploads/2025/08/Lit-Rectangle-black-scaled-e1754460691526.png",
      href: "/lit-lighting-solutions",
    },
  ];

  const socials = [
    { icon: Facebook, color: "hover:bg-blue-600" },
    { icon: Twitter, color: "hover:bg-sky-500" },
    { icon: Linkedin, color: "hover:bg-blue-700" },
  ];

  // --- SERVICES DATA ---
  const services = [
    {
      icon: Wrench,
      title: "Installation Services",
      firstLetter: "",
      rest: "Installation Services",
      description:
        "With in-house technical experts and registered electrical engineers, Disruptive Solutions Inc. ensures every installation meets the highest standards. Our site visits and assessments allow us to design accurate, efficient, and customized lighting solutions right from the ground up.",
      bullets: [],
      accent: "bg-gradient-to-br from-gray-900 to-gray-800",
    },
    {
      icon: HeadphonesIcon,
      title: "After-Sales Services",
      firstLetter: "",
      rest: "After-Sales Services",
      description:
        "Our commitment to clients extends beyond the point of purchase. We take pride in delivering excellent after-sales support designed to ensure satisfaction, reliability, and long-term value.",
      bullets: ["Auditing — Lux Reading Verification", "Product Orientation"],
      accent: "bg-gradient-to-br from-[#d11a2a] to-red-700",
    },
    {
      icon: PhoneCall,
      title: "Customer Care Call Center",
      firstLetter: "",
      rest: "Customer Care Call Center",
      description:
        "Disruptive Solutions Inc. proudly operates its own in-house Customer Care Call Center, delivering excellent customer service with a customer satisfaction rating of 4.82 and a guaranteed 10-minute response time – ensuring reliable, timely client assistance.",
      bullets: [],
      stats: [
        { value: "4.82", label: "Satisfaction Rating" },
        { value: "10min", label: "Response Time" },
      ],
      accent: "bg-gradient-to-br from-gray-900 to-gray-800",
    },
  ];

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserSession(user);
      } else {
        setUserSession(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "brand_name"),
      where("website", "==", "Disruptive Solutions Inc"),
      orderBy("createdAt", "desc"),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setBrands(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const [partners, setPartners] = useState<any[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, "brand_name"),
      where("website", "==", "Disruptive Solutions Inc"),
      orderBy("createdAt", "desc"),
    );
    const unsub = onSnapshot(q, (snap) => {
      const urls = snap.docs.map((doc) => doc.data().logoUrl);
      setPartners(urls.length > 0 ? [...urls, ...urls, ...urls] : []);
    });
    return () => unsub();
  }, []);

  if (partners.length === 0) return null;

  const getGridConfig = () => {
    const count = brands.length;
    if (count === 1) return "grid-cols-1 max-w-[500px]";
    if (count === 2) return "grid-cols-1 md:grid-cols-2 max-w-[1000px]";
    if (count === 3) return "grid-cols-1 md:grid-cols-3 max-w-[1200px]";
    if (count === 4) return "grid-cols-2 lg:grid-cols-4 max-w-[1400px]";
    return "grid-cols-2 md:grid-cols-3 lg:grid-cols-5 max-w-[1550px]";
  };

  const handleLogout = () => {
    localStorage.removeItem("disruptive_user_session");
    setUserSession(null);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-[#d11a2a]/10 selection:text-[#d11a2a] overflow-x-hidden">
      <FloatingMenuWidget />

      {/* --- MOBILE NAV --- */}
      <AnimatePresence>
        {isNavOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNavOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-md z-[2000] lg:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{
                type: "tween",
                duration: 0.4,
                ease: [0.23, 1, 0.32, 1],
              }}
              className="fixed top-0 left-0 h-full w-[80%] bg-[#0a0a0a] z-[2001] lg:hidden flex flex-col shadow-2xl"
            >
              <div className="p-8 flex items-center justify-between border-b border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent">
                <motion.img
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  src={LOGO_WHITE}
                  alt="Logo"
                  className="h-11 w-auto object-contain brightness-110"
                />
                <button
                  onClick={() => setIsNavOpen(false)}
                  className="w-10 h-10 flex items-center justify-center border border-white/10 rounded-full text-white/40 hover:text-white hover:bg-[#d11a2a] hover:border-[#d11a2a] transition-all duration-300"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-grow py-4 px-2">
                {navLinks.map((link, idx) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsNavOpen(false)}
                    className="group flex items-center justify-between px-6 py-5 border-b border-white/5 relative overflow-hidden transition-all"
                  >
                    <div className="flex items-center gap-4 relative z-10">
                      <span className="text-[10px] font-mono text-[#d11a2a] opacity-50 group-hover:opacity-100">
                        0{idx + 1}
                      </span>
                      <span className="text-xs font-black uppercase tracking-[0.2em] text-white group-hover:translate-x-2 transition-transform duration-300">
                        {link.name}
                      </span>
                    </div>
                    <ArrowRight
                      size={14}
                      className="text-white/20 group-hover:text-[#d11a2a] group-hover:translate-x-1 transition-all"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#d11a2a]/10 to-transparent translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500" />
                  </Link>
                ))}

                {userSession && (
                  <div className="mt-8 px-6 space-y-4">
                    <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.4em]">
                      Internal Systems
                    </p>
                    <div className="grid gap-2">
                      <Link
                        href="/catalog"
                        onClick={() => setIsNavOpen(false)}
                        className="flex items-center gap-3 text-[10px] font-bold text-white/70 uppercase tracking-widest hover:text-[#d11a2a] transition-colors"
                      >
                        <FileSignature size={14} /> Catalog
                      </Link>
                      <Link
                        href="/portal"
                        onClick={() => setIsNavOpen(false)}
                        className="flex items-center gap-3 text-[10px] font-bold text-white/70 uppercase tracking-widest hover:text-[#d11a2a] transition-colors"
                      >
                        <ShieldCheck size={14} /> Client Portal
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-white/5 bg-white/[0.02]">
                <Link
                  href="/quote"
                  onClick={() => setIsNavOpen(false)}
                  className="flex items-center justify-between group"
                >
                  <span className="text-[11px] font-black uppercase tracking-widest text-white">
                    Start a Project
                  </span>
                  <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-[#d11a2a] group-hover:border-[#d11a2a] transition-all">
                    <Zap size={14} className="text-white fill-white" />
                  </div>
                </Link>
                <div className="mt-8 flex justify-between items-center opacity-30">
                  <span className="text-[8px] font-bold text-white uppercase tracking-widest italic flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />{" "}
                    System Active
                  </span>
                  <span className="text-[8px] font-bold text-white uppercase tracking-widest">
                    v2.0.26
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- NAVIGATION --- */}
      <nav className="fixed top-0 left-0 w-full z-[1000] py-4 transition-all duration-500">
        <motion.div
          initial={false}
          animate={{
            backgroundColor: isScrolled
              ? "rgba(255, 255, 255, 0.75)"
              : "rgba(255, 255, 255, 0)",
            backdropFilter: isScrolled ? "blur(16px)" : "blur(0px)",
            boxShadow: isScrolled
              ? "0 4px 30px rgba(0, 0, 0, 0.05)"
              : "0 0px 0px rgba(0, 0, 0, 0)",
            height: isScrolled ? "70px" : "90px",
          }}
          className="absolute inset-0 transition-all duration-500"
        />
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between relative z-10 h-full">
          <div className="relative shrink-0">
            <Link href="/">
              <motion.img
                animate={{ scale: isScrolled ? 0.85 : 1 }}
                src={isScrolled ? LOGO_RED : LOGO_WHITE}
                alt="Logo"
                className="h-10 md:h-12 w-auto object-contain transition-all duration-500"
              />
            </Link>
          </div>

          <motion.div
            initial={false}
            animate={{
              gap: isScrolled ? "2px" : "12px",
              backgroundColor: isScrolled
                ? "rgba(0, 0, 0, 0.03)"
                : "rgba(255, 255, 255, 0.15)",
            }}
            className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center py-1.5 rounded-full transition-all duration-500 ease-in-out border border-white/10"
          >
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`px-5 py-2 text-[11px] font-black uppercase tracking-[0.15em] transition-all duration-500 rounded-full relative group ${isScrolled ? "text-gray-900" : "text-white"}`}
              >
                <motion.span className="absolute inset-0 bg-[#d11a2a] rounded-full -z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-100" />
                <span className="relative z-10 group-hover:text-white transition-colors">
                  {link.name}
                </span>
              </Link>
            ))}
          </motion.div>

          <div className="hidden lg:flex items-center gap-4">
            {userSession && (
              <div className="flex items-center gap-4 pl-4 border-l border-white/10">
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Link
                    href="/catalog"
                    className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-500 border-2 flex items-center gap-2 ${isScrolled ? "border-gray-200 text-gray-900 hover:bg-gray-100" : "border-white/20 text-white hover:bg-white/10"}`}
                  >
                    <FileSignature size={14} className="text-[#d11a2a]" />
                    Catalog
                  </Link>
                </motion.div>

                <div className="relative group">
                  <div className="flex items-center cursor-pointer py-2">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${isScrolled ? "border-[#d11a2a] bg-red-50" : "border-white/30 bg-white/10"}`}
                    >
                      <User
                        size={18}
                        className={isScrolled ? "text-[#d11a2a]" : "text-white"}
                      />
                    </div>
                    <div className="absolute top-full right-0 mt-2 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-[1001]">
                      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden text-left">
                        <div className="p-5 bg-gray-50 border-b border-gray-100">
                          <p className="text-[9px] font-black text-[#d11a2a] uppercase tracking-widest mb-1 italic">
                            Active Partner
                          </p>
                          <h4 className="text-sm font-black text-gray-900 uppercase truncate">
                            {userSession.displayName || "Disruptive User"}
                          </h4>
                          <p className="text-[10px] font-medium text-gray-400 truncate lowercase">
                            {userSession.email}
                          </p>
                        </div>
                        <div className="p-2">
                          <Link
                            href="/portal"
                            className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-red-50 text-gray-600 hover:text-[#d11a2a] transition-colors"
                          >
                            <ShieldCheck size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest">
                              Client Portal
                            </span>
                          </Link>
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-gray-900 hover:text-white text-gray-400 transition-all"
                          >
                            <LogOut size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest">
                              Sign Out
                            </span>
                          </button>
                        </div>
                        <div className="px-5 py-3 bg-gray-900 flex justify-between items-center">
                          <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em]">
                            Source
                          </span>
                          <span className="text-[8px] font-black text-white uppercase tracking-[0.2em]">
                            {userSession.website}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <motion.div animate={{ scale: isScrolled ? 0.9 : 1 }}>
              <Link
                href="/quote"
                className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-500 shadow-xl ${isScrolled ? "bg-[#d11a2a] text-white shadow-red-500/20" : "bg-white text-gray-900"}`}
              >
                Free Quote
              </Link>
            </motion.div>
          </div>

          <button
            className="lg:hidden p-2 relative z-[1001]"
            onClick={() => setIsNavOpen(true)}
          >
            <div className="space-y-1.5">
              <div
                className={`w-6 h-0.5 transition-all ${isScrolled ? "bg-black" : "bg-white"}`}
              ></div>
              <div
                className={`w-4 h-0.5 transition-all ${isScrolled ? "bg-[#d11a2a]" : "bg-white/60"}`}
              ></div>
            </div>
          </button>
        </div>
      </nav>

      {/* --- HERO --- */}
      <section className="relative h-screen flex items-center justify-center bg-[#0a0a0a] overflow-hidden text-center">
        <motion.div
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.5 }}
          transition={{ duration: 2 }}
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=2069')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-white" />
        <div className="relative z-10 px-6 max-w-5xl">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[#d11a2a] text-sm font-black uppercase tracking-[0.5em] mb-6 block"
          >
            Home of Lighting Excellence
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white text-6xl md:text-8xl font-black uppercase tracking-tighter leading-[0.9] mb-8"
          >
            Disruptive <br />{" "}
            <span className="text-[#d11a2a] drop-shadow-[0_0_30px_rgba(209,26,42,0.3)]">
              Solutions Inc.
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto font-medium mb-10"
          >
            Delivering smart, future-ready, and premium quality lighting
            solutions built to match the evolving demands of construction,
            infrastructure, and industrial projects.
          </motion.p>
        </div>
      </section>

      {/* --- ABOUT SECTION --- */}
      <section className="py-32 px-6 relative bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center mb-32">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tighter uppercase leading-none mb-8">
                Lighting the <br />
                <span className="text-[#d11a2a]">Future, Today.</span>
              </h2>
              <p className="text-gray-500 text-lg leading-relaxed mb-8">
                We deliver end-to-end lighting solutions supported by a
                comprehensive product portfolio, from dependable economy options
                and intelligent mid-range systems to premium lighting solutions.
              </p>
              <div className="grid grid-cols-2 gap-6">
                {[
                  ["5 Branches", "Nationwide Service"],
                  ["15 Years", "Of Industry Expertise"],
                ].map(([val, label]) => (
                  <div key={label} className="border-l-4 border-[#d11a2a] pl-4">
                    <div className="text-3xl font-black text-gray-900">
                      {val}
                    </div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative rounded-[40px] overflow-hidden aspect-video shadow-2xl shadow-black/20"
            >
              <img
                src="https://disruptivesolutionsinc.com/wp-content/uploads/2025/12/image-1.png"
                className="w-full h-full object-cover"
                alt="Architecture"
              />
              <div className="absolute inset-0 bg-[#d11a2a]/10 mix-blend-overlay" />
            </motion.div>
          </div>

          {/* ABOUT CARDS — First letter red */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Lightbulb,
                title: "Drive Innovation",
                desc: "Future-ready lighting systems built for the evolving demands of infrastructure.",
              },
              {
                icon: Zap,
                title: "Stand Accountable",
                desc: "Design and implementation of LED and smart automation for large-scale enterprises.",
              },
              {
                icon: Target,
                title: "Ignite Excellence",
                desc: "Warehousing, Logistics, Real Estate, and Corporate Institutional facilities.",
              },
            ].map((item, i) => {
              const firstLetter = item.title.charAt(0);
              const restOfTitle = item.title.slice(1);
              return (
                <motion.div
                  key={i}
                  whileHover={{ y: -10 }}
                  className="p-10 rounded-[32px] bg-gray-50 border border-gray-100 group transition-all"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-xl flex items-center justify-center mb-8 group-hover:bg-[#d11a2a] group-hover:text-white transition-all duration-500">
                    <item.icon
                      size={28}
                      className="text-[#d11a2a] group-hover:text-white"
                    />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-4 uppercase tracking-tighter">
                    <span className="text-[#d11a2a]">{firstLetter}</span>
                    {restOfTitle}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* --- SERVICES SECTION --- */}
      <section className="py-32 px-6 bg-[#0a0a0a] relative overflow-hidden">
        {/* Background texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />
        <div className="max-w-7xl mx-auto relative z-10">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <span className="inline-flex items-center gap-2 text-[#d11a2a] text-[10px] font-black uppercase tracking-[0.4em] mb-6 bg-red-950/40 px-5 py-2 rounded-full border border-red-900/30">
              <Zap size={12} className="fill-[#d11a2a]" /> What We Offer
            </span>
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase leading-none mb-4">
              Our <span className="text-[#d11a2a]">Services</span>
            </h2>
            <p className="text-white/40 text-sm font-medium max-w-xl mx-auto">
              End-to-end lighting solutions backed by technical expertise,
              reliable support, and a team committed to your satisfaction.
            </p>
          </motion.div>

          {/* Services Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {services.map((service, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -8 }}
                className={`relative rounded-[32px] overflow-hidden p-8 md:p-10 flex flex-col gap-6 ${service.accent} border border-white/5 shadow-2xl`}
              >
                {/* Icon */}
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
                  <service.icon size={26} className="text-white" />
                </div>

                {/* Title — first letter red */}
                <div>
                  <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-white leading-tight mb-4">
                    <span className="text-[#d11a2a]">
                      {service.firstLetter}
                    </span>
                    {service.rest}
                  </h3>
                  <p className="text-white/60 text-sm leading-relaxed font-medium">
                    {service.description}
                  </p>
                </div>

                {/* Bullet Points */}
                {service.bullets && service.bullets.length > 0 && (
                  <ul className="space-y-3">
                    {service.bullets.map((bullet, j) => (
                      <li key={j} className="flex items-start gap-3">
                        <CheckCircle2
                          size={16}
                          className="text-[#d11a2a] shrink-0 mt-0.5"
                        />
                        <span className="text-white/70 text-[12px] font-bold uppercase tracking-wide">
                          {bullet}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Stats (for Call Center card) */}
                {service.stats && service.stats.length > 0 && (
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    {service.stats.map((stat, j) => (
                      <div
                        key={j}
                        className="bg-white/10 rounded-2xl p-4 border border-white/10 text-center"
                      >
                        <div className="text-2xl font-black text-white">
                          {stat.value}
                        </div>
                        <div className="text-[9px] font-black text-white/40 uppercase tracking-widest mt-1">
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Decorative corner accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] rounded-bl-[60px]" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* BRANDS SECTION */}
      <section className="relative w-full bg-white overflow-hidden py-24">
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.2]"
          style={{
            backgroundImage: `linear-gradient(to right, #e5e7eb 1px, transparent 4px), linear-gradient(to bottom, #e5e7eb 1px, transparent 4px)`,
            backgroundSize: "40px 40px",
          }}
        />
        <div className="max-w-full mx-auto px-8 md:px-16 lg:px-28 relative z-10 flex flex-col items-center">
          <div className="flex flex-col items-center justify-center text-center mb-16 max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-col items-center"
            >
              <span className="inline-flex items-center gap-2 text-[#d11a2a] text-[10px] font-black uppercase tracking-[0.4em] mb-6 bg-red-50 px-5 py-2 rounded-full border border-red-100/50">
                <Zap size={12} className="fill-[#d11a2a]" /> Premium Products
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-[-0.04em] uppercase leading-[0.9] mb-8">
                Our{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d11a2a] to-red-500">
                  Brands
                </span>
              </h2>
              <div className="h-1.5 w-16 bg-[#d11a2a] mb-8 rounded-full shadow-[0_2px_10px_rgba(209,26,42,0.3)]" />
            </motion.div>
          </div>

          <motion.div
            className={`grid gap-5 md:gap-6 w-full justify-center mx-auto ${getGridConfig()}`}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.1 } },
            }}
          >
            {brands.map((brand) => {
              const isSoon = brand.status?.toLowerCase() === "soon";
              return (
                <motion.div
                  key={brand.id}
                  variants={{
                    hidden: { opacity: 0, y: 30 },
                    show: { opacity: 1, y: 0 },
                  }}
                  whileHover={!isSoon ? { y: -8 } : {}}
                  className="w-full flex justify-center"
                >
                  <Link
                    href={isSoon ? "#" : brand.href || "#"}
                    className={`group relative w-full h-[400px] md:h-[460px] block rounded-[28px] overflow-hidden bg-gray-900 shadow-xl border border-gray-100 transition-all duration-500 ${isSoon ? "cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <div className="absolute inset-0 overflow-hidden">
                      <img
                        src={brand.image}
                        alt={brand.title}
                        className={`w-full h-full object-cover transition-transform duration-1000 ${isSoon ? "brightness-[0.3] grayscale group-hover:grayscale-0 group-hover:scale-110" : "brightness-[0.6] group-hover:scale-110 group-hover:brightness-[0.4]"}`}
                      />
                      <div
                        className={`absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90 transition-opacity ${isSoon ? "group-hover:opacity-60" : ""}`}
                      />
                    </div>

                    {isSoon && (
                      <div className="absolute inset-0 flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 px-8 py-3 rounded-full">
                          <span className="text-white text-xs font-black uppercase tracking-[0.3em] drop-shadow-lg">
                            Coming Soon
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="absolute inset-0 p-6 md:p-7 flex flex-col justify-end z-10">
                      <div className="mb-4">
                        <span className="bg-[#d11a2a] text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-md">
                          {brand.category}
                        </span>
                      </div>
                      <div className="space-y-3">
                        <h3
                          className={`text-lg md:text-xl font-black text-white uppercase tracking-tighter leading-tight transition-colors ${isSoon ? "group-hover:text-red-400" : ""}`}
                        >
                          {brand.title}
                        </h3>
                        <p className="text-white/80 text-[10px] md:text-xs leading-relaxed line-clamp-3 font-medium italic">
                          {brand.description}
                        </p>
                        {!isSoon && (
                          <div className="flex items-center gap-3 pt-2 text-white/60 group-hover:text-[#d11a2a] transition-colors">
                            <div className="h-[1.5px] w-6 bg-white/20 group-hover:bg-[#d11a2a] group-hover:w-10 transition-all duration-500" />
                            <span className="text-[9px] font-black uppercase tracking-widest">
                              Learn More
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
