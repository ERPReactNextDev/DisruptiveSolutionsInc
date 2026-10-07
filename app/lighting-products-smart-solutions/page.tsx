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
// --- COMPONENTS ---
import QuoteCartPanel from "../components/QuoteCartPanel";
import {
  Loader2,
  X,
  ShoppingBag,
  Plus,
  Trash2,
  Check,
  Minus,
  ChevronRight,
  Star
} from "lucide-react";


// --- INTERFACES ---
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
  [key: string]: any; // Pinapayagan ang dynamic key access para sa setFilters
}

export default function BrandsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [dbCategories, setDbCategories] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [quoteCart, setQuoteCart] = useState<any[]>([]);
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState("CATEGORIES"); 
  
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

  const updateQuantity = (productId: string, delta: number) => {
  const updatedCart = quoteCart.map((item) => {
    if (item.id === productId) {
      const newQty = (item.quantity || 1) + delta;
      return { ...item, quantity: newQty > 0 ? newQty : 1 };
    }
    return item;
  });
  
  setQuoteCart(updatedCart);
  localStorage.setItem("disruptive_quote_cart", JSON.stringify(updatedCart));
  // Optional: window.dispatchEvent(new Event("cartUpdated")); kung kailangan ng sync sa ibang page
};

  // --- 1. FETCH CATEGORIES ---
  useEffect(() => {
    const q = query(
      collection(db, "categoriesmaintenance"),
      where("isActive", "==", true), 
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDbCategories(cats);
    });

    return () => unsubscribe();
  }, []);

  // --- 2. FETCH PRODUCTS ---
  useEffect(() => {
    const q = query(
      collection(db, "products"),
      where("website", "==", "Disruptive Solutions Inc"),
      where("brand", "==", "Zumtobel"),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      console.log("Fetched Products:", data.length); // DEBUGGING
      setProducts(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  

  // --- SYNC CART ---
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

  // --- FILTER LOGIC ---
  const filteredProducts = useMemo(() => {
    const activeCategoryNames = dbCategories.map((cat: any) => cat.title?.trim().toUpperCase());

    return products.filter((product) => {
      // 1. Check kung ang product ay kabilang sa active categories
      const hasActiveCategory = product.dynamicSpecs?.some((spec: any) => 
        activeCategoryNames.includes(spec.value?.trim().toUpperCase())
      );

      if (!hasActiveCategory) return false;

      // 2. Sidebar Filters Logic
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
              (key === "power" && r.name.toLowerCase() === "wattage") ||
              (key === "lampType" && r.name.toLowerCase() === "lamp type") ||
              (key === "mountingType" && r.name.toLowerCase() === "mounting type")
            );
            if (foundRow && foundRow.value.toLowerCase().includes(filterValue.toString().toLowerCase())) {
              hasMatch = true;
            }
          });
        }

        if (!hasMatch) return false;
      }

      // 3. Flux/Lumen Range Filter
      if (filters.fluxFrom || filters.fluxTo) {
        let productFlux = 0;
        product.technicalSpecs?.forEach((spec: any) => {
          const row = spec.rows?.find((r: any) => r.name.toLowerCase().includes("lumen") || r.name.toLowerCase().includes("flux"));
          if (row) productFlux = parseInt(row.value.replace(/[^0-9]/g, "")) || 0;
        });
        const from = parseInt(filters.fluxFrom) || 0;
        const to = parseInt(filters.fluxTo) || 999999;
        if (productFlux < from || productFlux > to) return false;
      }
      return true;
    });
  }, [products, filters, dbCategories]);

  const addToQuote = (product: any) => {
    const currentCart = JSON.parse(localStorage.getItem("disruptive_quote_cart") || "[]");
    if (!currentCart.find((item: any) => item.id === product.id)) {
      const updatedCart = [...currentCart, { ...product, quantity: 1 }];
      localStorage.setItem("disruptive_quote_cart", JSON.stringify(updatedCart));
      window.dispatchEvent(new Event("cartUpdated"));
      setIsCartOpen(true);
    }
  };

  const removeFromQuote = (id: string) => {
    const currentCart = JSON.parse(localStorage.getItem("disruptive_quote_cart") || "[]");
    const updatedCart = currentCart.filter((item: any) => item.id !== id);
    localStorage.setItem("disruptive_quote_cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-[#d11a2a] selection:text-white overflow-x-hidden">
      <Navbar />
      <FloatingChatWidget/>
 {/* HERO SECTION - ORIGINAL COLOR VERSION */}
<section className="relative h-[60vh] w-full flex items-center justify-center overflow-hidden">
  {/* Tinanggal ang opacity-40 para full color ang image */}
  <div className="absolute inset-0">
    <SmartImage 
      src="https://disruptivesolutionsinc.com/wp-content/uploads/2025/11/ZUMTOBELs.png" 
      className="w-full h-full object-cover" 
      alt="Hero" 
    />
  </div>

  {/* Opsyonal: Kung gusto mo ng konting shadow sa ilalim para mabasa ang text pero buhay pa rin ang kulay */}
  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20" />

  <div className="relative z-10 text-center">
    {/* Dito mo ilagay ang content mo */}
  </div>
</section>

      <section className="py-6 md:py-12 px-4 md:px-6 max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
          
          <div className="lg:col-span-9 order-2 lg:order-1">
            <div className="mb-8 flex flex-col md:flex-row md:items-center gap-4 border-b border-gray-200">
              <span className="text-[11px] font-bold uppercase tracking-tight text-gray-900 pb-4 md:pb-0">Sort view according to:</span>
              <div className="flex">
                {["CATEGORIES", "APPLICATIONS", "HIGHLIGHTS"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveView(tab)}
                    className={`px-6 py-3 text-[11px] font-black tracking-widest transition-all border-t border-x border-transparent ${
                      activeView === tab 
                        ? "bg-white border-gray-200 text-gray-900 -mb-[1px]" 
                        : "bg-gray-100 text-gray-400 hover:text-gray-600"
                    }`}
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
      // 1. I-filter ang products na pasok sa category na ito
      const categoryProducts = filteredProducts.filter((p) =>
        p.dynamicSpecs?.some((spec: any) =>
          spec.value?.trim().toUpperCase() === category.title?.trim().toUpperCase()
        )
      );

      // 2. HIDE LOGIC: Kung walang produkto sa category na ito (kahit dahil sa filter), wag i-render
      if (categoryProducts.length === 0) return null;

      const isOpen = openCategoryId === category.id;

      return (
        <div key={category.id} className="overflow-hidden border-b border-gray-50">
          {/* CATEGORY HEADER BUTTON */}
          <button
            onClick={() => setOpenCategoryId(isOpen ? null : category.id)}
            className={`w-full flex items-start justify-between p-4 md:p-8 transition-all hover:bg-gray-50 ${
              isOpen ? "bg-gray-50" : ""
            }`}
          >
<div className="flex gap-6 md:gap-10 text-left items-center">
  {/* NILAKIHAN ANG CONTAINER: Mula w-14 naging w-20/24 */}
  <div className="w-16 h-16 md:w-24 md:h-24 bg-white border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden rounded-xl shadow-md transition-transform duration-500 group-hover:scale-105">
    {category.imageUrl ? (
      <SmartImage
        src={category.imageUrl}
        className="w-full h-full object-cover" // Kung gusto mong hindi maputol ang image, gamitin ang 'object-contain' at dagdagan ng p-2
        alt={category.title}
      />
    ) : (
      <span className="text-xs font-black text-gray-300">
        0{index + 1}
      </span>
    )}
  </div>

  <div className="flex flex-col justify-center">
    {/* NILAKIHAN ANG TEXT PARA SUMABAY SA IMAGE */}
    <h3
      className={`text-lg md:text-1xl font-black tracking-tighter uppercase transition-colors ${
        isOpen ? "text-[#d11a2a]" : "text-gray-900"
      }`}
    >
      {category.title}
    </h3>
    <p className="text-[10px] md:text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">
      {categoryProducts.length} Premium Products
    </p>
  </div>
</div>

            <div className="flex items-center gap-4">
              <span className="hidden md:block text-[9px] font-black bg-white border px-3 py-1 rounded-full uppercase italic shadow-sm">
                {categoryProducts.length} Items
              </span>
              <div className="p-2 bg-white rounded-full border border-gray-100 shadow-sm">
                {isOpen ? (
                  <Minus size={16} className="text-[#d11a2a]" />
                ) : (
                  <Plus size={16} className="text-gray-400" />
                )}
              </div>
            </div>
          </button>

          {/* PRODUCT GRID SECTION */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="bg-[#fcfcfc]"
              >
                <div className="p-4 md:p-8 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
{categoryProducts.map((product) => {
  const isInCart = quoteCart.some((item) => item.id === product.id);
  const firstGroup = product.technicalSpecs?.[0];
  
  // LOGIC PARA SA STARS
  const rating = product.rating || 0;
  const count = product.reviewCount || 0;

  return (
    <div
      key={product.id}
      className="bg-white rounded-xl md:rounded-[24px] overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-500 flex flex-col group/card relative"
    >
      <Link href={`/lighting-products-smart-solutions/${product.id}`}>
        <div className="relative h-64 sm:h-72 md:h-80 w-full bg-[#fcfcfc] p-2 flex items-center justify-center overflow-hidden">
          
          <SmartImage 
            src={product.mainImage} 
            className="max-w-[95%] max-h-[95%] object-contain group-hover/card:scale-105 group-hover/card:blur-[4px] transition-all duration-700" 
            alt={product.name} 
          />
          
          {/* HOVER SPECS OVERLAY */}
          <motion.div 
            initial={{ opacity: 0 }} 
            whileHover={{ opacity: 1 }} 
            className="absolute inset-0 bg-black/80 backdrop-blur-[3px] flex flex-col justify-center items-center p-6 z-30"
          >
            {/* ... (Technical Specs Table mo dito) ... */}
          </motion.div>

          {/* SKU Tag */}
          <div className="absolute top-3 left-3 bg-white/95 px-3 py-1.5 rounded-lg text-[8px] font-black uppercase border border-gray-100 z-10 shadow-sm">
            {product.sku}
          </div>

          {/* NEW: RATING BADGE SA IBABAW NG IMAGE (Floating Style) */}
          {count > 0 && (
            <div className="absolute top-3 right-3 bg-black/90 text-white px-2 py-1 rounded-md flex items-center gap-1 z-10 shadow-lg backdrop-blur-sm border border-white/10">
              <Star size={8} className="fill-yellow-500 text-yellow-500" />
              <span className="text-[9px] font-black italic">{rating}</span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-4 md:p-5 flex flex-col flex-1 border-t border-gray-50 bg-white z-20">
        
        {/* NEW: REVIEW STATS ROW */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                size={10} 
                className={`${i < Math.floor(rating) ? "fill-yellow-500 text-yellow-500" : "text-gray-200"}`} 
              />
            ))}
          </div>
          <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">
            ({count} {count <= 1 ? 'Review' : 'Reviews'})
          </span>
        </div>

        <h4 className="text-[10px] md:text-[11px] font-black uppercase italic leading-tight line-clamp-2 min-h-[32px]">
          {product.name}
        </h4>

        <button
          onClick={() => addToQuote(product)}
          className={`mt-4 w-full py-2.5 md:py-3 text-[8px] md:text-[9px] font-black uppercase rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm ${
            isInCart
              ? "bg-green-600 text-white"
              : "bg-gray-900 text-white hover:bg-[#d11a2a] hover:shadow-lg"
          }`}
        >
          {isInCart ? (
            <><Check size={12} strokeWidth={3} /> Added</>
          ) : (
            <><Plus size={12} strokeWidth={3} /> Add to Quote</>
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

    {/* OPTIONAL: EMPTY STATE kapag lahat ng category ay walang laman dahil sa filter */}
    {dbCategories.every(cat => 
      !filteredProducts.some(p => 
        p.dynamicSpecs?.some((spec: any) => 
          spec.value?.trim().toUpperCase() === cat.title?.trim().toUpperCase()
        )
      )
    ) && (
      <div className="py-20 text-center">
        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">
          No products found matching your filters.
        </p>
      </div>
    )}
  </div>
)}

                {activeView === "APPLICATIONS" && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <Application filteredProducts={filteredProducts} addToQuote={addToQuote} quoteCart={quoteCart} />
                  </div>
                )}

               {activeView === "HIGHLIGHTS" && (
  <Highlights 
    products={filteredProducts} 
    addToQuote={addToQuote} 
    quoteCart={quoteCart} 
  />
)}
              </>
            )}
          </div>

          <aside className="lg:col-span-3 order-1 lg:order-2">
            <div className="lg:sticky lg:top-24">
              <ProductFilter 
                products={products} 
                productCount={filteredProducts.length} 
                filters={filters} 
                setFilters={setFilters} 
                activeView={activeView}
              />
            </div>
          </aside>
        </div>
      </section>

      <Footer />

      {/* CART DRAWER */}
<AnimatePresence>
        {isCartOpen && (
          <>
            {/* BACKDROP */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsCartOpen(false)} 
              className="fixed inset-0 bg-black/70 backdrop-blur-md z-[2000]" 
            />

            {/* SIDE PANEL */}
            <motion.div 
              initial={{ x: "100%" }} 
              animate={{ x: 0 }} 
              exit={{ x: "100%" }} 
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-[2001] shadow-2xl flex flex-col" 
            >
              {/* HEADER */}
              <div className="p-8 border-b flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black uppercase italic leading-none">My Quote List</h2>
                  <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-widest">
                    {quoteCart.length} Unique Items
                  </p>
                </div>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20}/>
                </button>
              </div>

              {/* LIST OF ITEMS */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#fcfcfc]">
                {quoteCart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-10">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 mb-4">
                      <ShoppingBag size={40} />
                    </div>
                    <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Your list is empty</p>
                  </div>
                ) : (
                  quoteCart.map((item) => (
                    <div key={item.id} className="flex gap-4 p-4 bg-white border border-gray-100 rounded-[28px] items-center shadow-sm">
                      {/* Product Image */}
                      <div className="w-16 h-16 bg-gray-50 p-2 rounded-xl flex items-center justify-center shrink-0">
                        <SmartImage src={item.mainImage} className="max-h-full object-contain" alt={item.name} />
                      </div>

                      {/* Product Name & Controls */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[11px] font-black uppercase truncate leading-tight mb-2 italic">{item.name}</h4>
                        
                        {/* --- QUANTITY CONTROLS --- */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1 border border-gray-100">
                            <button 
                              onClick={() => updateQuantity(item.id, -1)}
                              className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded-md hover:text-[#d11a2a] hover:border-[#d11a2a] transition-all"
                            >
                              <Minus size={12} strokeWidth={3} />
                            </button>
                            
                            <span className="w-6 text-center text-[12px] font-black">
                              {item.quantity || 1}
                            </span>

                            <button 
                              onClick={() => updateQuantity(item.id, 1)}
                              className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded-md hover:text-[#d11a2a] hover:border-[#d11a2a] transition-all"
                            >
                              <Plus size={12} strokeWidth={3} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Delete Button */}
                      <button 
                        onClick={() => removeFromQuote(item.id)} 
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* FOOTER */}
              <div className="p-8 border-t bg-white">
                <Link 
                  href="/checkout" 
                  onClick={() => setIsCartOpen(false)}
                  className={`block w-full py-6 text-center rounded-[24px] font-black uppercase text-[12px] tracking-[0.1em] transition-all shadow-xl active:scale-95 ${
                    quoteCart.length === 0 
                    ? "bg-gray-100 text-gray-400 pointer-events-none" 
                    : "bg-[#d11a2a] text-white shadow-red-500/20 hover:bg-black"
                  }`}
                >
                  Confirm & Request Quote
                </Link>
                <p className="text-center text-[9px] text-gray-400 font-bold uppercase mt-4 tracking-widest">
                  Free of charge • Quick response
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}