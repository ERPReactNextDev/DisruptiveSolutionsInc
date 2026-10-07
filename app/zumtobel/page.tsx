"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { SmartImage } from "@/components/ui/smart-image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, where } from "firebase/firestore";
import Navbar from "../components/navigation/navbar";
import Footer from "../components/navigation/footer";
import Application from "../components/application";
import ProductFilter from "../components/zumtobelfilter"; 
import Highlights from "../components/Highlights";
import FloatingChatWidget from "../components/chat-widget";
import {
  Loader2,
  X,
  ShoppingBag,
  Plus,
  Trash2,
  Check,
  Minus,
  Star,
  Search
} from "lucide-react";
import FloatingMenuWidget from "../components/menu-widget";

interface FilterState {
  application: string;
  mountingType: string;
  colour: string;
  lightDistribution: string;
  lampType: string;
  lampColour: string;
  power: string;
  connection: string;
  fluxFrom: string;
  fluxTo: string;
  [key: string]: any;
}

export default function BrandsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [dbCategories, setDbCategories] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [quoteCart, setQuoteCart] = useState<any[]>([]);
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState("CATEGORIES");
  
  // 🔥 NEW: Search state
  const [searchQuery, setSearchQuery] = useState("");
  
  const [filters, setFilters] = useState<FilterState>({
    application: "*",
    mountingType: "*",
    colour: "*",
    lightDistribution: "*",
    lampType: "*",
    lampColour: "*",
    power: "*",
    connection: "*",
    fluxFrom: "",
    fluxTo: ""
  });

  const updateQuantity = (productSlug: string, delta: number) => {
    const updatedCart = quoteCart.map((item) => {
      if (item.id === productSlug) {
        const newQty = (item.quantity || 1) + delta;
        return { ...item, quantity: newQty > 0 ? newQty : 1 };
      }
      return item;
    });
    
    setQuoteCart(updatedCart);
    localStorage.setItem("disruptive_quote_cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  useEffect(() => {
    const q = query(
      collection(db, "categoriesmaintenance"),
      where("isActive", "==", true), 
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDbCategories(cats);
    });
    return () => unsubscribe();
  }, []);
// --- 2. FETCH PRODUCTS (LIT BRAND) ---
  useEffect(() => {
    // ✅ CORRECT QUERY - Using array-contains for brands array
    const q = query(
      collection(db, "products"),
      where("brands", "array-contains", "Zumtobel"),  // Check if "LIT" is in brands array
      orderBy("createdAt", "desc")
    );
    
    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({ 
          id: doc.id, 
          ...doc.data() 
        }));
        
        // 🔥 ADDITIONAL CLIENT-SIDE FILTER (Optional, for extra safety)
        // Filter for products that also have "Disruptive Solutions Inc" in websites array
        const filteredData = data.filter((product: any) => {
          const hasCorrectWebsite = Array.isArray(product.websites) 
            ? product.websites.includes("Disruptive Solutions Inc")
            : product.website === "Disruptive Solutions Inc"; // Fallback for old schema
          
          return hasCorrectWebsite;
        });
        
        setProducts(filteredData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching products:", error);
        setLoading(false);
      }
    );
    
    return () => unsubscribe();
  }, []);

  const syncCart = useCallback(() => {
    const savedCart = localStorage.getItem("disruptive_quote_cart");
    if (savedCart) {
      try { setQuoteCart(JSON.parse(savedCart)); } catch (e) { console.error(e); }
    } else { setQuoteCart([]); }
  }, []);

  useEffect(() => {
    syncCart();
    window.addEventListener("storage", syncCart);
    window.addEventListener("cartUpdated", syncCart);
    return () => {
      window.removeEventListener("storage", syncCart);
      window.removeEventListener("cartUpdated", syncCart);
    };
  }, [syncCart]);

  // 🔥 UPDATED: filteredProducts now includes search functionality
  const filteredProducts = useMemo(() => {
    const activeCategoryNames = dbCategories.map((cat: any) => cat.title?.trim().toUpperCase());

    return products.filter((product) => {
      // Category filter
      const hasActiveCategory = product.dynamicSpecs?.some((spec: any) => 
        activeCategoryNames.includes(spec.value?.trim().toUpperCase())
      );
      if (!hasActiveCategory) return false;

      // 🔥 NEW: Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = product.name?.toLowerCase().includes(query);
        const matchesSKU = product.sku?.toLowerCase().includes(query);
        const matchesDescription = product.shortDescription?.toLowerCase().includes(query);
        
        // Search in technical specs
        const matchesSpecs = product.technicalSpecs?.some((spec: any) =>
          spec.rows?.some((row: any) =>
            row.name?.toLowerCase().includes(query) ||
            row.value?.toLowerCase().includes(query)
          )
        );

        // Search in dynamic specs
        const matchesDynamicSpecs = product.dynamicSpecs?.some((spec: any) =>
          spec.title?.toLowerCase().includes(query) ||
          spec.value?.toLowerCase().includes(query)
        );

        if (!matchesName && !matchesSKU && !matchesDescription && !matchesSpecs && !matchesDynamicSpecs) {
          return false;
        }
      }

      // Other filters
      const activeEntries = Object.entries(filters).filter(([key, value]) => {
        return value !== "*" && value !== "" && key !== "fluxFrom" && key !== "fluxTo";
      });

      for (const [key, filterValue] of activeEntries) {
        let hasMatch = product.dynamicSpecs?.some((spec: any) => 
            spec.title?.toLowerCase() === key.toLowerCase() && 
            spec.value?.toLowerCase() === filterValue.toString().toLowerCase()
        );
        if (!hasMatch && product.technicalSpecs) {
          product.technicalSpecs.forEach((spec: any) => {
            const foundRow = spec.rows?.find((r: any) => 
              r.name.toLowerCase() === key.toLowerCase() || 
              (key === "power" && r.name.toLowerCase() === "wattage")
            );
            if (foundRow && foundRow.value.toLowerCase().includes(filterValue.toString().toLowerCase())) {
              hasMatch = true;
            }
          });
        }
        if (!hasMatch) return false;
      }
      return true;
    });
  }, [products, filters, dbCategories, searchQuery]);

  const addToQuote = (product: any) => {
    const currentCart = JSON.parse(localStorage.getItem("disruptive_quote_cart") || "[]");
    const itemSlug = product.slug;
    
    if (!currentCart.find((item: any) => item.id === itemSlug)) {
      const updatedCart = [...currentCart, { ...product, id: itemSlug, quantity: 1 }];
      localStorage.setItem("disruptive_quote_cart", JSON.stringify(updatedCart));
      window.dispatchEvent(new Event("cartUpdated"));
      setIsCartOpen(true);
    }
  };

  const removeFromQuote = (slug: string) => {
    const currentCart = JSON.parse(localStorage.getItem("disruptive_quote_cart") || "[]");
    const updatedCart = currentCart.filter((item: any) => item.id !== slug);
    localStorage.setItem("disruptive_quote_cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-[#d11a2a] selection:text-white overflow-x-hidden">
      <Navbar />
      <FloatingMenuWidget/>
      
      {/* Hero Section */}
      <section className="relative h-[60vh] w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <SmartImage src="/images/zumtobel.png" className="w-full h-full object-cover" alt="Hero" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20" />
      </section>

      <section className="py-6 md:py-12 px-4 md:px-6 max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
          <div className="lg:col-span-9 order-2 lg:order-1">
            {/* 🔥 NEW: Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products by name, SKU, or specifications..."
                  className="w-full pl-12 pr-12 py-4 border-2 border-gray-200 rounded-2xl text-sm font-bold placeholder:text-gray-400 focus:outline-none focus:border-[#d11a2a] transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 rounded-full transition-all"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
              {searchQuery && (
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs font-bold text-gray-500">
                    Found <span className="text-[#d11a2a] font-black">{filteredProducts.length}</span> products matching "{searchQuery}"
                  </p>
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-xs font-bold text-gray-400 hover:text-[#d11a2a] transition-colors"
                  >
                    Clear search
                  </button>
                </div>
              )}
            </div>

            <div className="mb-8 flex flex-col md:flex-row md:items-center gap-4 border-b border-gray-200">
              <span className="text-[11px] font-bold uppercase tracking-tight text-gray-900 pb-4 md:pb-0">Sort view according to:</span>
              <div className="flex">
                {["CATEGORIES", "APPLICATIONS", "HIGHLIGHTS"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveView(tab)}
                    className={`px-6 py-3 text-[11px] font-black tracking-widest transition-all border-t border-x border-transparent ${activeView === tab ? "bg-white border-gray-200 text-gray-900 -mb-[1px]" : "bg-gray-100 text-gray-400"}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#d11a2a]" /></div>
            ) : (
              <>
                {activeView === "CATEGORIES" && (
                  <div className="divide-y divide-gray-100 animate-in fade-in duration-500">
                    {dbCategories.map((category, index) => {
                      const categoryProducts = filteredProducts.filter((p) =>
                        p.dynamicSpecs?.some((spec: any) => spec.value?.trim().toUpperCase() === category.title?.trim().toUpperCase())
                      );
                      if (categoryProducts.length === 0) return null;
                      const isOpen = openCategoryId === category.id;

                      return (
                        <div key={category.id} className="overflow-hidden border-b border-gray-50">
                          <button onClick={() => setOpenCategoryId(isOpen ? null : category.id)} className={`w-full flex items-start justify-between p-4 md:p-8 transition-all hover:bg-gray-50 ${isOpen ? "bg-gray-50" : ""}`}>
                            <div className="flex gap-6 md:gap-10 text-left items-center">
                              <div className="w-16 h-16 md:w-24 md:h-24 bg-white border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden rounded-xl shadow-md">
                                {category.imageUrl ? <SmartImage src={category.imageUrl} className="w-full h-full object-cover" alt={category.title} /> : <span className="text-xs font-black text-gray-300">0{index + 1}</span>}
                              </div>
                              <div className="flex flex-col justify-center">
                                <h3 className={`text-lg md:text-1xl font-black uppercase transition-colors ${isOpen ? "text-[#d11a2a]" : "text-gray-900"}`}>{category.title}</h3>
                                <p className="text-[10px] md:text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">{categoryProducts.length} Premium Products</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="p-2 bg-white rounded-full border border-gray-100 shadow-sm">
                                {isOpen ? <Minus size={16} className="text-[#d11a2a]" /> : <Plus size={16} className="text-gray-400" />}
                              </div>
                            </div>
                          </button>

                          <AnimatePresence>
                            {isOpen && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-[#fcfcfc]">
                                <div className="p-4 md:p-8 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                                  {categoryProducts.map((product) => {
                                    const isInCart = quoteCart.some((item) => item.id === product.slug);
                                    return (
                                      <div key={product.slug} className="bg-white rounded-xl md:rounded-[24px] overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-500 flex flex-col group/card relative">
                                        <Link href={`/zumtobel/${product.slug}`}>
                                          <div className="relative h-64 sm:h-72 md:h-80 w-full bg-[#fcfcfc] p-2 flex items-center justify-center overflow-hidden">
                                            <SmartImage src={product.mainImage} className="max-w-[95%] max-h-[95%] object-contain group-hover/card:scale-105 transition-all duration-700" alt={product.name} />
                                            <div className="absolute top-3 left-3 bg-white/95 px-3 py-1.5 rounded-lg text-[8px] font-black uppercase border border-gray-100 z-10">{product.sku}</div>
                                          </div>
                                        </Link>
                                        <div className="p-4 md:p-5 flex flex-col flex-1 border-t border-gray-50 bg-white z-20">
                                          <div className="flex items-center gap-2 mb-2">
                                            <div className="flex gap-0.5">
                                              {[...Array(5)].map((_, i) => (
                                                <Star key={i} size={10} className={`${i < Math.floor(product.rating || 0) ? "fill-yellow-500 text-yellow-500" : "text-gray-200"}`} />
                                              ))}
                                            </div>
                                            <span className="text-[8px] font-bold text-gray-400">({product.reviewCount || 0} Reviews)</span>
                                          </div>
                                          <Link href={`/zumtobel/${product.slug}`} className="block group/link">
  <h4 className="text-[10px] md:text-[11px] font-black uppercase italic leading-tight line-clamp-2 min-h-[32px] group-hover/link:text-[#d11a2a] transition-colors">
    {product.name}
  </h4>
</Link>

<button 
  onClick={() => addToQuote(product)} 
  className={`mt-4 w-full py-2.5 md:py-3 text-[8px] md:text-[9px] font-black uppercase rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 ${
    isInCart ? "bg-green-600 text-white" : "bg-gray-900 text-white hover:bg-[#d11a2a]"
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
                                      </div>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                )}
                {activeView === "APPLICATIONS" && <div className="animate-in fade-in slide-in-from-bottom-4 duration-700"><Application filteredProducts={filteredProducts} addToQuote={addToQuote} quoteCart={quoteCart} /></div>}
                {activeView === "HIGHLIGHTS" && <Highlights products={filteredProducts} addToQuote={addToQuote} quoteCart={quoteCart} />}
              </>
            )}
          </div>

          <aside className="lg:col-span-3 order-1 lg:order-2">
            <div className="lg:sticky lg:top-24">
              <ProductFilter products={products} productCount={filteredProducts.length} filters={filters} setFilters={setFilters} activeView={activeView} />
            </div>
          </aside>
        </div>
      </section>

      <Footer />

      {/* CART DRAWER */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCartOpen(false)} className="fixed inset-0 bg-black/70 backdrop-blur-md z-[2000]" />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-[2001] shadow-2xl flex flex-col">
              <div className="p-8 border-b flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black uppercase italic leading-none">My Quote List</h2>
                  <p className="text-[10px] text-gray-400 font-bold mt-1 tracking-widest">{quoteCart.length} Unique Items</p>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#fcfcfc]">
                {quoteCart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-10">
                    <ShoppingBag size={40} className="text-gray-200 mb-4" />
                    <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Your list is empty</p>
                  </div>
                ) : (
                  quoteCart.map((item) => (
                    <div key={item.id} className="flex gap-4 p-4 bg-white border border-gray-100 rounded-[28px] items-center shadow-sm">
                      <div className="w-16 h-16 bg-gray-50 p-2 rounded-xl flex items-center justify-center shrink-0">
                        <SmartImage src={item.mainImage} className="max-h-full object-contain" alt={item.name} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[11px] font-black uppercase truncate italic">{item.name}</h4>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1 border border-gray-100">
                            <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded-md hover:text-[#d11a2a]"><Minus size={12} /></button>
                            <span className="w-6 text-center text-[12px] font-black">{item.quantity || 1}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded-md hover:text-[#d11a2a]"><Plus size={12} /></button>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => removeFromQuote(item.id)} className="p-2 text-gray-300 hover:text-red-500 transition-all"><Trash2 size={18} /></button>
                    </div>
                  ))
                )}
              </div>
              <div className="p-8 border-t bg-white">
                <Link href="/checkout" onClick={() => setIsCartOpen(false)} className={`block w-full py-6 text-center rounded-[24px] font-black uppercase text-[12px] tracking-[0.1em] ${quoteCart.length === 0 ? "bg-gray-100 text-gray-400 pointer-events-none" : "bg-[#d11a2a] text-white hover:bg-black"}`}>
                  Confirm & Request Quote
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}