"use client";

import React, { useState, useEffect } from "react"; // Added React hooks
import Link from "next/link";
import { Facebook, Instagram, Linkedin, ChevronUp } from "lucide-react";
import SignUpNewsletter from "../SignUpNewsletter";
import { auth, db } from "@/lib/firebase"; // Added Firebase imports
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function Footer() {
  const [userSession, setUserSession] = useState<any>(null);

  // --- LOGGING ENGINE ---
  const logActivity = async (actionName: string) => {
    try {
      await addDoc(collection(db, "cmsactivity_logs"), {
        page: actionName,
        timestamp: serverTimestamp(),
        userAgent: typeof window !== "undefined" ? navigator.userAgent : "Server",
        userEmail: userSession?.email || "Anonymous Guest",
      });
    } catch (err) {
      console.error("Footer Log Failed:", err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserSession(user ? user : null);
    });
    return () => unsubscribe();
  }, []);

  const LOGO_WHITE = "/images/disruptive.png";
  
  const socials = [
    { name: "Facebook", icon: Facebook, href: "#", color: "hover:bg-[#1877F2]" },
    { name: "Instagram", icon: Instagram, href: "#", color: "hover:bg-[#E4405F]" },
    { name: "LinkedIn", icon: Linkedin, href: "#", color: "hover:bg-[#0A66C2]" },
  ];

  const footerLinks = [
    { name: "About Us", href: "/about" },
    { name: "Blog", href: "/blog" },
    { name: "Careers", href: "/careers" },
    { name: "Contact Us", href: "/contact-us" },
  ];

  return (
    <footer className="bg-[#0a0a0a] text-white pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20 items-start">
          <div className="space-y-8">
            <img src={LOGO_WHITE} alt="Logo" className="h-12" />
            <p className="text-gray-500 text-sm leading-relaxed max-w-sm">
              Lighting excellence driven by engineering, innovation, and forward-thinking design. Your Partner For Brighter Solutions.
            </p>
            <div className="flex gap-4">
              {socials.map((soc, i) => (
                <Link 
                  key={i} 
                  href={soc.href} 
                  onClick={() => logActivity(`Footer: Social Click - ${soc.name}`)}
                  className={`h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center transition-all duration-300 hover:bg-white/10 hover:-translate-y-1 ${soc.color}`}
                >
                  <soc.icon size={18} />
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-[#d11a2a]">Quick Links</h4>
            <ul className="space-y-4">
              {footerLinks.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href} 
                    onClick={() => logActivity(`Footer: Link Click - ${link.name}`)}
                    className="text-gray-400 text-sm flex items-center gap-2 hover:text-white transition-colors group"
                  >
                    <span className="h-[2px] w-0 bg-[#d11a2a] group-hover:w-3 transition-all" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2 bg-white/5 backdrop-blur-xl rounded-[32px] p-10 border border-white/10 shadow-xl flex flex-col justify-between">
            {/* Note: I-log mo rin dapat sa loob ng SignUpNewsletter component yung form submission */}
            <SignUpNewsletter />
          </div>
        </div>

        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-bold text-gray-500 tracking-[0.25em] uppercase">
          <p>© 2026 Disruptive Solutions Inc.</p>
          <button 
            onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
                logActivity("Footer: Back to Top Click");
            }} 
            className="flex items-center gap-2 hover:text-[#d11a2a] transition-all"
          >
            Top <ChevronUp size={16} />
          </button>
        </div>
      </div>
    </footer>
  );
}