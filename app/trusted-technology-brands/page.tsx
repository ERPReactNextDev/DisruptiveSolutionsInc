"use client";

import React, { useEffect, useState } from "react";
import { SmartImage } from "@/components/ui/smart-image";
import Link from "next/link";
import { motion } from "framer-motion";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

// UI Components
import Navbar from "../components/navigation/navbar";
import Footer from "../components/navigation/footer";
import FloatingMenuWidget from "../components/menu-widget";

// Icons
import { ArrowRight, Loader2 } from "lucide-react";

// --- TYPE DEFINITION ---
interface Brand {
  id: string;
  title: string;
  image: string;
  description: string;
  status?: string;
  website: string;
  href?: string;
}

export default function BrandsShowcase() {
  const [dynamicBrands, setDynamicBrands] = useState<Brand[]>([]);
  const [brandProducts, setBrandProducts] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);

  // --- 1. AUTH & SESSION ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, () => {});
    return () => unsubscribe();
  }, []);

  // --- 3. FETCH PRODUCTS ---
  // No where clause — fetch all products and filter in-memory by p.brands[].
  // This matches the working pattern in app/brands/page.tsx and avoids silent
  // failures from exact-match issues on the "websites" array field.
  const fetchProductsForBrands = async (brandsList: Brand[]) => {
    try {
      const querySnapshot = await getDocs(collection(db, "products"));
      const allProducts = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const results: Record<string, any[]> = {};
      brandsList.forEach((brand) => {
        const brandNameNorm = brand.title?.toString().toLowerCase().trim();
        results[brand.id] = allProducts.filter((p: any) => {
          // Match against p.brands[] array (primary)
          const inBrandsArray =
            Array.isArray(p.brands) &&
            p.brands.some(
              (b: any) =>
                typeof b === "string" &&
                b.toLowerCase().trim() === brandNameNorm,
            );
          // Also match against p.brand string field (legacy)
          const inBrandField =
            typeof p.brand === "string" &&
            p.brand.toLowerCase().trim() === brandNameNorm;
          return inBrandsArray || inBrandField;
        });
      });

      setBrandProducts(results);
    } catch (error) {
      console.error("Fetch Error:", error);
    }
  };

  // --- 2. FETCH BRANDS FROM DATABASE (DYNAMIC) ---
  useEffect(() => {
    const q = query(
      collection(db, "brand_name"),
      where("website", "==", "Disruptive Solutions Inc"),
      orderBy("title", "asc"),
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const allBrands: Brand[] = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as Brand,
      );

      const filteredBrands = allBrands.filter(
        (brand) => brand.status !== "soon",
      );

      setDynamicBrands(filteredBrands);

      if (filteredBrands.length > 0) {
        await fetchProductsForBrands(filteredBrands);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans antialiased text-slate-900 overflow-x-hidden">
      <Navbar />
      <FloatingMenuWidget />

      {/* --- HERO SECTION --- */}
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

      {/* DYNAMIC BRAND SHOWCASE */}
      <main className="flex-grow w-full relative z-20">
        {loading ? (
          <div className="py-40 text-center flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-[#d11a2a] mb-4" size={48} />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
              Synchronizing Forge Data...
            </p>
          </div>
        ) : (
          dynamicBrands.map((brand) => {
            const products = brandProducts[brand.id];
            // undefined = still loading | [] = resolved with 0 products | [...] = has products

            // Hide brand sections confirmed to have 0 matching products
            if (Array.isArray(products) && products.length === 0) return null;

            return (
              <section
                key={brand.id}
                className="w-full py-24 border-b border-gray-50 bg-white"
              >
                <div className="max-w-[1400px] mx-auto px-8 md:px-12 flex flex-col lg:flex-row gap-20 items-start">
                  {/* BRAND SIDEBAR */}
                  <div className="w-full lg:w-[360px] flex-shrink-0 space-y-10 text-center lg:text-left lg:sticky lg:top-24">
                    <SmartImage
                      src={brand.image}
                      alt={brand.title}
                      className="h-32 md:h-44 w-auto object-contain mx-auto lg:mx-0"
                      fallback={
                        <div className="h-32 md:h-44 flex items-center justify-center mx-auto lg:mx-0 bg-gray-50 rounded-xl px-6">
                          <span className="text-xl font-black uppercase italic text-gray-300 tracking-tight">
                            {brand.title}
                          </span>
                        </div>
                      }
                    />

                    <div className="space-y-4">
                      <h2 className="text-3xl font-black italic uppercase text-gray-900">
                        {brand.title} SELECTION
                      </h2>
                      <p className="text-[13px] text-gray-500 font-bold uppercase tracking-wide leading-relaxed line-clamp-4">
                        {brand.description}
                      </p>
                    </div>

                    <Link
                      href={brand.href || "#"}
                      className="inline-flex items-center justify-between w-full md:w-auto md:min-w-[240px] px-8 py-5 bg-black text-white hover:bg-[#d11a2a] transition-all"
                    >
                      <span className="text-[10px] font-black uppercase tracking-[0.4em]">
                        View {brand.title}'s Solutions
                      </span>
                      <ArrowRight size={18} />
                    </Link>
                  </div>

                  {/* PRODUCTS GRID */}
                  <div className="flex-1 w-full min-w-0">
                    {products === undefined ? (
                      // Loading skeleton
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="flex flex-col items-center gap-3 py-5 px-3 rounded-2xl bg-gray-50 animate-pulse">
                            <div className="w-full aspect-square rounded-xl bg-gray-200" />
                            <div className="h-3 w-3/4 rounded bg-gray-200" />
                            <div className="h-2 w-1/4 rounded bg-gray-200" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                          {products.slice(0, 8).map((product: any) => (
                            <Link
                              key={product.id}
                              href={`/lighting-products-smart-solutions/${product.id}`}
                              className="group flex flex-col items-center gap-3 py-5 px-3 rounded-2xl border border-transparent hover:border-[#d11a2a] hover:bg-white hover:shadow-lg transition-all duration-200"
                            >
                              <div className="w-full aspect-square flex items-center justify-center overflow-hidden rounded-xl bg-gray-50 group-hover:bg-white transition-colors">
                                {product.mainImage ? (
                                  <SmartImage
                                    src={product.mainImage}
                                    alt={product.name}
                                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <span className="text-gray-200 text-[8px] font-bold uppercase">No Image</span>
                                  </div>
                                )}
                              </div>
                              <p className="text-[9px] font-black uppercase italic text-center leading-tight text-gray-700 group-hover:text-[#d11a2a] transition-colors line-clamp-2">
                                {product.name}
                              </p>
                              <ArrowRight size={10} className="text-gray-300 group-hover:text-[#d11a2a] group-hover:translate-x-0.5 transition-all" />
                            </Link>
                          ))}
                        </div>

                        {products.length > 8 && (
                          <div className="mt-8 flex justify-center lg:justify-start">
                            <Link
                              href={brand.href || "#"}
                              className="inline-flex items-center gap-2 border border-gray-200 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-500 hover:border-[#d11a2a] hover:text-[#d11a2a] transition-all"
                            >
                              View All {products.length} Products <ArrowRight size={12} />
                            </Link>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </section>
            );
          })
        )}
      </main>

      <Footer />
    </div>
  );
}
