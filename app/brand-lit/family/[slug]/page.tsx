"use client";

import React, { useState, useEffect, useCallback } from "react";
import { SmartImage } from "@/components/ui/smart-image";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import Navbar from "@/app/components/navigation/navbar";
import Footer from "@/app/components/navigation/footer";
import FloatingMenuWidget from "@/app/components/menu-widget";
import QuoteCartPanel from "@/app/components/QuoteCartPanel";
import {
  ArrowLeft,
  Plus,
  Check,
  Loader2,
  Search,
  X,
  Star,
  ChevronRight,
  Filter,
  SlidersHorizontal,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// helpers
const toSlug = (title: string) =>
  title
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

export default function ProductFamilyPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [family, setFamily] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [quoteCart, setQuoteCart] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<"default" | "name" | "sku">("default");

  // Sync cart
  const syncCart = useCallback(() => {
    const saved = localStorage.getItem("disruptive_quote_cart");
    setQuoteCart(saved ? JSON.parse(saved) : []);
  }, []);

  useEffect(() => {
    syncCart();
    window.addEventListener("cartUpdated", syncCart);
    window.addEventListener("storage", syncCart);
    return () => {
      window.removeEventListener("cartUpdated", syncCart);
      window.removeEventListener("storage", syncCart);
    };
  }, [syncCart]);

  // Fetch family + products
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Find the family by slug
        const famSnap = await getDocs(collection(db, "productfamilies"));
        const allFamilies = famSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        const matched = allFamilies.find(
          (f: any) => toSlug(f.title || "") === slug,
        ) as any;

        if (!matched) {
          setFamily(null);
          setLoading(false);
          return;
        }
        setFamily(matched);

        // 2. Fetch all products and filter by this family
        const prodSnap = await getDocs(
          query(collection(db, "products"), orderBy("createdAt", "desc")),
        );
        const allProducts = prodSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        const familyTitle = matched.title?.trim().toUpperCase();
        const filtered = allProducts.filter(
          (p: any) =>
            p.productFamily?.trim().toUpperCase() === familyTitle ||
            p.dynamicSpecs?.some(
              (spec: any) => spec.value?.trim().toUpperCase() === familyTitle,
            ),
        );

        setProducts(filtered);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchData();
  }, [slug]);

  const addToQuote = (product: any) => {
    const currentCart = JSON.parse(
      localStorage.getItem("disruptive_quote_cart") || "[]",
    );
    if (!currentCart.find((i: any) => i.id === product.id)) {
      const updated = [...currentCart, { ...product, quantity: 1 }];
      localStorage.setItem("disruptive_quote_cart", JSON.stringify(updated));
      window.dispatchEvent(new Event("cartUpdated"));
    }
  };

  // Filter + sort
  const filteredProducts = products
    .filter((p) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        p.name?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.itemCode?.toLowerCase().includes(q) ||
        p.shortDescription?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
      if (sortBy === "sku")
        return (a.sku || a.itemCode || "").localeCompare(
          b.sku || b.itemCode || "",
        );
      return 0;
    });

  // ── Loading state ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-[#d11a2a]" size={40} />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">
            Loading Family...
          </p>
        </div>
      </div>
    );
  }

  // ── Not found ─────────────────────────────────────────────────
  if (!family) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6">
        <p className="text-3xl font-black uppercase italic text-gray-200">
          Family Not Found
        </p>
        <Link
          href="/brand-lit"
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:text-[#d11a2a] transition-colors"
        >
          <ArrowLeft size={14} /> Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden selection:bg-[#d11a2a] selection:text-white">
      <Navbar />
      <FloatingMenuWidget />

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative h-[50vh] md:h-[60vh] w-full overflow-hidden bg-[#050505]">
        {/* Background image */}
        {family.imageUrl && (
          <div className="absolute inset-0">
            <SmartImage
              src={family.imageUrl}
              alt={family.title}
              className="w-full h-full object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-[#050505]" />
          </div>
        )}

        {/* Noise texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")",
          }}
        />

        <div className="relative z-50">
          <Navbar />
        </div>

        <div className="absolute bottom-0 left-0 w-full px-6 md:px-16 pb-10 z-10">
          <div className="max-w-6xl mx-auto space-y-4">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-white/40">
              <Link href="/" className="hover:text-white/70 transition-colors">
                Home
              </Link>
              <ChevronRight size={10} />
              <Link
                href="/brand-lit"
                className="hover:text-white/70 transition-colors"
              >
                LIT Products
              </Link>
              <ChevronRight size={10} />
              <span className="text-[#d11a2a]">{family.title}</span>
            </nav>

            {/* Brand label */}
            <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
              <span className="text-yellow-400 text-[10px] font-black uppercase tracking-[0.4em]">
                LIT — Product Family
              </span>
            </div>

            {/* Title */}
            <h1 className="text-white text-4xl md:text-8xl font-black uppercase tracking-tighter leading-[0.85] italic">
              {family.title}
            </h1>

            {/* Description */}
            {family.description && (
              <div className="max-w-2xl border-l-4 border-yellow-400/40 pl-6 py-1">
                <p className="text-white/60 text-sm md:text-base font-medium leading-relaxed">
                  {family.description}
                </p>
              </div>
            )}

            {/* Product count badge */}
            <div className="flex items-center gap-4">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30">
                {products.length} Products Available
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── BACK BUTTON ────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 pt-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-[#d11a2a] transition-colors group"
        >
          <ArrowLeft
            size={14}
            className="group-hover:-translate-x-1 transition-transform"
          />
          Back to Products
        </button>
      </div>

      {/* ── FILTERS + SEARCH ───────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pt-8 pb-4">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center bg-gray-50 rounded-2xl p-4 border border-gray-100">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, SKU, or specs..."
              className="w-full pl-11 pr-10 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold placeholder:text-gray-300 focus:outline-none focus:border-[#d11a2a] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-3 h-3 text-gray-400" />
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal
              size={14}
              className="text-gray-400 flex-shrink-0"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-wider text-gray-700 outline-none focus:border-[#d11a2a] cursor-pointer"
            >
              <option value="default">Default Order</option>
              <option value="name">Sort by Name</option>
              <option value="sku">Sort by SKU</option>
            </select>
          </div>

          {/* Results count */}
          <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex-shrink-0">
            {filteredProducts.length} / {products.length} Results
          </div>
        </div>
      </section>

      {/* ── PRODUCT GRID ───────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-32 border-2 border-dashed border-gray-100 rounded-[40px]">
            <p className="text-gray-300 font-black uppercase tracking-widest text-lg italic">
              {products.length === 0
                ? "No products in this family"
                : "No results found"}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="mt-4 text-[10px] font-black uppercase text-[#d11a2a] hover:underline"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.05 } },
            }}
          >
            {filteredProducts.map((product) => {
              const isInCart = quoteCart.some((i) => i.id === product.id);
              const firstSpecGroup = product.technicalSpecs?.[0];
              const specRows =
                firstSpecGroup?.specs || firstSpecGroup?.rows || [];

              return (
                <motion.div
                  key={product.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    show: { opacity: 1, y: 0 },
                  }}
                  className="bg-white rounded-[28px] border border-gray-100 overflow-hidden hover:shadow-2xl hover:shadow-black/5 transition-all duration-500 flex flex-col group/card"
                >
                  {/* Image zone */}
                  <Link href={`/brand-lit/${product.slug || product.id}`}>
                    <div className="relative h-56 md:h-64 bg-[#fafafa] flex items-center justify-center overflow-hidden p-6">
                      <SmartImage
                        src={
                          product.mainImage ||
                          family.imageUrl ||
                          "/placeholder.svg"
                        }
                        alt={product.name}
                        className="max-h-full object-contain group-hover/card:scale-110 group-hover/card:blur-[2px] transition-all duration-700"
                      />

                      {/* Specs overlay */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                        className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col justify-center items-center p-5 z-20"
                      >
                        <p className="text-[9px] font-black text-[#d11a2a] uppercase tracking-widest mb-3 italic">
                          Technical Specs
                        </p>
                        <table className="w-full border-collapse">
                          <tbody className="divide-y divide-white/10">
                            {specRows.slice(0, 5).map((row: any, i: number) => (
                              <tr key={i}>
                                <td className="py-1.5 text-[8px] font-bold text-gray-400 uppercase italic">
                                  {row.name}
                                </td>
                                <td className="py-1.5 text-[9px] font-black text-white uppercase text-right">
                                  {row.value || "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {specRows.length === 0 && (
                          <p className="text-[9px] text-white/30 font-bold uppercase italic">
                            View product details →
                          </p>
                        )}
                      </motion.div>

                      {/* SKU tag */}
                      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[8px] font-black uppercase border border-gray-100 z-10">
                        {product.itemCode || product.sku || "—"}
                      </div>

                      {/* Rating badge */}
                      {(product.reviewCount || 0) > 0 && (
                        <div className="absolute top-4 right-4 bg-black/80 text-white px-2 py-1 rounded-lg flex items-center gap-1 z-10 text-[8px] font-black">
                          <Star
                            size={8}
                            className="fill-yellow-400 text-yellow-400"
                          />
                          {product.rating}
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Info zone */}
                  <div className="p-5 flex flex-col flex-1 gap-3 border-t border-gray-50">
                    <div>
                      <div className="flex gap-1 mb-1.5">
                        {product.brands?.slice(0, 1).map((b: string) => (
                          <span
                            key={b}
                            className="text-[7px] font-black uppercase bg-black text-white px-2 py-0.5 rounded"
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                      <Link href={`/brand-lit/${product.slug || product.id}`}>
                        <h4 className="text-[11px] font-black uppercase italic leading-tight line-clamp-2 text-gray-900 group-hover/card:text-[#d11a2a] transition-colors">
                          {product.name}
                        </h4>
                      </Link>
                    </div>

                    <button
                      onClick={() => addToQuote(product)}
                      className={`w-full py-3 text-[9px] font-black uppercase rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 mt-auto ${
                        isInCart
                          ? "bg-green-600 text-white"
                          : "bg-black text-white hover:bg-[#d11a2a]"
                      }`}
                    >
                      {isInCart ? (
                        <>
                          <Check size={12} strokeWidth={3} /> Added
                        </>
                      ) : (
                        <>
                          <Plus size={12} strokeWidth={3} /> Add to Quote
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </section>

      <Footer />

      <QuoteCartPanel />
    </div>
  );
}
