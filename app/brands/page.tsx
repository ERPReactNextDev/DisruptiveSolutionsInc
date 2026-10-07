"use client";

import React, { useState, useEffect } from "react";
import { SmartImage } from "@/components/ui/smart-image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import {
  ArrowRight,
  ChevronUp,
  Menu,
  Search,
  LayoutGrid,
  Loader2,
} from "lucide-react";

export default function BrandsPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNavOpen, setIsNavOpen] = useState(false);

  const LOGO_RED = "/images/disruptive.png";
  const LOGO_WHITE = "/images/disruptive.png";

  const navLinks = [
    { name: "Home", href: "/dashboard" },
    {
      name: "Products & Solutions",
      href: "/lighting-products-smart-solutions",
    },
    { name: "Brands", href: "/trusted-technology-brands" },
    { name: "Contact", href: "/contact-us" },
  ];

  // --- 1. FETCH PRODUCTS FROM FIRESTORE ---
  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProducts(productData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- 2. FILTER LOGIC ---
  const filteredProducts =
    activeFilter === "All"
      ? products
      : products.filter((p) => p.brands?.includes(activeFilter));

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-[#d11a2a]/10 selection:text-[#d11a2a]">
      {/* --- NAVIGATION --- */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? "bg-white/95 backdrop-blur-md shadow-sm" : "bg-transparent"}`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* LOGO */}
          <Link href="/dashboard">
            <SmartImage
              src={isScrolled ? LOGO_RED : LOGO_WHITE}
              alt="Disruptive Solutions"
              className="h-8 w-auto transition-all duration-300"
            />
          </Link>

          {/* DESKTOP MENU */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`relative px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-all duration-300 rounded-xl group
                                    ${isScrolled ? "text-gray-700 hover:text-[#d11a2a]" : "text-white/80 hover:text-white"}`}
              >
                <span className="relative z-10">{link.name}</span>
              </Link>
            ))}
          </div>

          {/* RIGHT SIDE BUTTON */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/contact-us"
              className="bg-[#d11a2a] text-white px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-red-700 transition-all"
            >
              Free Quote
            </Link>
          </div>

          {/* MOBILE TOGGLE */}
          <button
            className={`md:hidden ${isScrolled ? "text-gray-900" : "text-white"}`}
            onClick={() => setIsNavOpen(true)}
          >
            <Menu size={24} />
          </button>
        </div>
      </nav>

      {/* MOBILE NAV DRAWER */}
      <AnimatePresence>
        {isNavOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-[100] flex flex-col items-center justify-center gap-6"
          >
            <button
              onClick={() => setIsNavOpen(false)}
              className="absolute top-6 right-6 text-white text-2xl font-black"
            >
              ✕
            </button>
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsNavOpen(false)}
                className="text-white text-2xl font-black uppercase tracking-widest hover:text-[#d11a2a] transition-all"
              >
                {link.name}
              </Link>
            ))}
            <Link
              href="/contact-us"
              onClick={() => setIsNavOpen(false)}
              className="mt-4 bg-[#d11a2a] text-white px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest"
            >
              Free Quote
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- HERO --- */}
      <section className="relative pt-52 pb-40 bg-[#0a0a0a] overflow-hidden">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-900/30 via-transparent to-transparent" />
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="text-[#d11a2a] text-[12px] font-black uppercase tracking-[0.6em] mb-6 block italic">
              Our Brands
            </span>
            <h1 className="text-white text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.9] mb-8">
              Our Disruptive
              <br />
              <span className="text-[#d11a2a] italic"> Brands.</span>
            </h1>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* --- FILTER SECTION --- */}
      <section className="relative z-20 -mt-12 md:-mt-24 px-4 md:px-6 pb-24">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-10 bg-gray-50 w-fit rounded-2xl p-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 px-3">
              Filter by brand
            </span>
            {["All", "LIT", "ZUMTOBEL"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${
                  activeFilter === tab
                    ? "bg-white text-[#d11a2a] shadow-sm"
                    : "text-gray-400 hover:text-gray-900"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* --- PRODUCT GRID --- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-3 flex items-center justify-center gap-3 py-24 text-gray-400 font-bold uppercase text-[10px] tracking-widest">
                <Loader2 size={16} className="animate-spin" /> Loading
                Masterpieces...
              </div>
            ) : (
              filteredProducts.map((product) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="group relative rounded-[32px] overflow-hidden bg-gray-100 aspect-[4/5] shadow-lg hover:shadow-2xl transition-all duration-500"
                >
                  {/* Background Image */}
                  {product.imageUrl && (
                    <SmartImage
                      src={product.imageUrl}
                      alt={product.name}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    {/* Brand Tags */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {product.brands?.map((brand: string) => (
                        <span
                          key={brand}
                          className="text-[9px] font-black uppercase tracking-widest bg-[#d11a2a] text-white px-3 py-1 rounded-full"
                        >
                          {brand}
                        </span>
                      ))}
                    </div>

                    <h3 className="text-white font-black text-lg uppercase tracking-tight leading-tight mb-1">
                      {product.name}
                    </h3>
                    <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-4">
                      SKU: {product.sku || "N/A"}
                    </p>

                    <Link
                      href={`/products/${product.id}`}
                      className="inline-flex items-center gap-2 bg-white text-[#d11a2a] px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#d11a2a] hover:text-white transition-all duration-300"
                    >
                      Explore Product <ArrowRight size={12} />
                    </Link>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {!loading && filteredProducts.length === 0 && (
            <div className="col-span-3 text-center py-24 text-gray-400 font-bold uppercase text-[11px] tracking-widest">
              No products found in this category.
            </div>
          )}
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="border-t border-gray-100 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            © 2026 Disruptive Solutions Inc.
          </p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#d11a2a] transition-all group"
          >
            Back to Top{" "}
            <ChevronUp
              size={14}
              className="group-hover:-translate-y-1 transition-transform"
            />
          </button>
        </div>
      </footer>
    </div>
  );
}
