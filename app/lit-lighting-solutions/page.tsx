"use client";

import React, { useState, useEffect } from "react";
import { SmartImage } from "@/components/ui/smart-image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { ArrowLeft, Loader2, Plus, ShoppingBag, Search, Zap, SlidersHorizontal, X, Trash2, ArrowRight } from "lucide-react";

export default function LitRedBlackPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quoteCart, setQuoteCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Products");
  const categories = ["All Products", "High Bay", "Floodlights", "Street Lights", "Industrial"];

  useEffect(() => {
    const savedCart = localStorage.getItem("disruptive_quote_cart");
    if (savedCart) setQuoteCart(JSON.parse(savedCart));
    const handleCartUpdate = () => {
      const updated = localStorage.getItem("disruptive_quote_cart");
      if (updated) setQuoteCart(JSON.parse(updated));
    };
    window.addEventListener("cartUpdated", handleCartUpdate);
    return () => window.removeEventListener("cartUpdated", handleCartUpdate);
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, "products"),
      where("website", "==", "Disruptive"),
      where("brands", "array-contains", "LIT") 
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All Products" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToQuote = (product: any) => {
    const currentCart = JSON.parse(localStorage.getItem("disruptive_quote_cart") || "[]");
    if (!currentCart.find((item: any) => item.id === product.id)) {
      const updatedCart = [...currentCart, { ...product, quantity: 1 }];
      localStorage.setItem("disruptive_quote_cart", JSON.stringify(updatedCart));
      window.dispatchEvent(new Event("cartUpdated"));
      setIsCartOpen(true);
    }
  };

  const removeFromCart = (productId: string) => {
    const updatedCart = quoteCart.filter(item => item.id !== productId);
    localStorage.setItem("disruptive_quote_cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-[#d11a2a] selection:text-white relative">
      
      {/* --- NAV --- */}
      <nav className="fixed top-0 w-full z-40 bg-black py-4 px-8 shadow-xl">
        <div className="max-w-[1500px] mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#d11a2a] hover:text-white transition-colors">
            <ArrowLeft size={16} /> Back
          </Link>
          <div className="text-[10px] font-black uppercase tracking-[0.4em] text-white italic">
            Lit <span className="text-[#d11a2a]">Industrial</span> Performance
          </div>
        </div>
      </nav>

      {/* --- FLOATING RED CART BUTTON --- */}
      <div className="fixed bottom-8 right-8 z-50">
        <button 
          onClick={() => setIsCartOpen(true)}
          className="bg-[#d11a2a] text-white p-5 shadow-[0_10px_30px_rgba(209,26,42,0.4)] hover:bg-black hover:scale-110 active:scale-95 transition-all group relative border-2 border-black"
        >
          <ShoppingBag size={24} strokeWidth={2.5} />
          {quoteCart.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-black text-[#d11a2a] text-[10px] w-7 h-7 flex items-center justify-center font-black border-2 border-[#d11a2a]">
              {quoteCart.length}
            </span>
          )}
        </button>
      </div>

      {/* --- INDUSTRIAL SIDE CART DRAWER --- */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            {/* Dark Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            
            {/* Drawer */}
            <motion.div 
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full md:w-[480px] bg-white z-[70] shadow-2xl flex flex-col border-l-8 border-black"
            >
              {/* Drawer Header */}
              <div className="p-8 bg-black text-white flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter italic">LIT <span className="text-[#d11a2a]">QUOTE_LIST</span></h2>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-1">Industrial Grade Logistics</p>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-[#d11a2a] text-white transition-all">
                  <X size={24} />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-grow overflow-y-auto p-8 space-y-6">
                {quoteCart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <ShoppingBag size={48} className="text-gray-100 mb-4" />
                    <p className="text-[11px] font-black uppercase tracking-widest text-gray-300">No items in queue.</p>
                  </div>
                ) : (
                  quoteCart.map((item) => (
                    <div key={item.id} className="flex gap-5 group border-b border-gray-100 pb-6 last:border-none">
                      <div className="w-24 h-24 bg-gray-50 border-2 border-gray-100 p-2 group-hover:border-[#d11a2a] transition-all">
                        <SmartImage src={item.mainImage} alt={item.name} className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-grow flex flex-col justify-center">
                        <h4 className="text-[13px] font-black uppercase leading-none tracking-tighter">{item.name}</h4>
                        <span className="text-[10px] font-bold text-[#d11a2a] mt-2 uppercase">SKU: {item.sku}</span>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="mt-4 flex items-center gap-1 text-[9px] font-black text-gray-400 hover:text-black uppercase tracking-widest transition-all"
                        >
                          <Trash2 size={12} /> [ Remove_Item ]
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-8 border-t-4 border-black bg-gray-50">
                <Link 
                  href="/quote-request-form"
                  className={`w-full py-5 flex items-center justify-center gap-4 text-[12px] font-black uppercase tracking-[0.3em] transition-all shadow-[0_10px_20px_rgba(0,0,0,0.1)] ${
                    quoteCart.length > 0 
                    ? "bg-[#d11a2a] text-white hover:bg-black" 
                    : "bg-gray-200 text-gray-400 pointer-events-none"
                  }`}
                >
                  Confirm Request <ArrowRight size={18} />
                </Link>
                <p className="text-center mt-6 text-[8px] font-bold text-gray-400 uppercase tracking-widest">
                  Secure Industrial Data Transmission
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- HEADER --- */}
      <header className="pt-32 pb-12 px-8 max-w-[1500px] mx-auto border-b-4 border-black flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#d11a2a]">
            <Zap size={18} fill="currentColor" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Industrial Lighting Systems</span>
          </div>
          <h1 className="text-5xl font-black uppercase tracking-tighter italic">LIT <span className="text-[#d11a2a]">Catalogue.</span></h1>
        </div>
        
        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#d11a2a]" size={18} />
          <input 
            type="text" 
            placeholder="FIND MODEL..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border-2 border-black py-3 pl-11 pr-4 text-xs font-bold focus:outline-none focus:ring-4 focus:ring-[#d11a2a]/10 transition-all uppercase tracking-widest" 
          />
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="px-8 py-16 max-w-[1500px] mx-auto flex flex-col lg:flex-row gap-12">
        <aside className="w-full lg:w-64 flex-shrink-0 space-y-8">
          <div className="flex items-center gap-2 pb-4 border-b-2 border-black">
            <SlidersHorizontal size={18} className="text-[#d11a2a]" />
            <span className="text-xs font-black uppercase tracking-[0.2em]">Filter_Engine</span>
          </div>
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Category</span>
            <div className="flex flex-col gap-1">
              {categories.map((cat) => (
                <button 
                  key={cat} 
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-left py-2 px-3 text-[11px] font-black uppercase tracking-tighter border-l-2 transition-all ${
                    selectedCategory === cat 
                    ? "border-[#d11a2a] bg-gray-50 text-[#d11a2a]" 
                    : "border-transparent hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="flex-grow">
          {loading ? (
            <div className="py-20 flex justify-center flex-col items-center gap-4">
              <Loader2 className="animate-spin text-[#d11a2a]" size={40} />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Syncing...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8">
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product) => (
                  <motion.div 
                    key={product.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="group relative flex flex-col bg-white"
                  >
                    <div className="relative aspect-square border-2 border-gray-100 group-hover:border-[#d11a2a] transition-all duration-300 overflow-hidden bg-white">
                      <div className="absolute inset-0 p-8 flex items-center justify-center">
                        <SmartImage src={product.mainImage || "/placeholder.jpg"} alt={product.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <Link href={`/lighting-products-smart-solutions/${product.id}`} className="absolute inset-0 z-10" />
                      <button 
                        onClick={(e) => { e.preventDefault(); addToQuote(product); }}
                        className={`absolute bottom-0 right-0 p-4 z-20 transition-all ${
                          quoteCart.find(item => item.id === product.id)
                          ? "bg-black text-[#d11a2a]"
                          : "bg-[#d11a2a] text-white translate-y-full group-hover:translate-y-0"
                        }`}
                      >
                        <Plus size={22} strokeWidth={4} />
                      </button>
                    </div>

                    <div className="pt-5">
                      <h3 className="text-[12px] font-black uppercase tracking-tight text-black line-clamp-1 group-hover:text-[#d11a2a] transition-colors">{product.name}</h3>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <div className="h-[2px] w-4 bg-[#d11a2a]"></div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{product.sku || "N/A"}</span>
                        </div>
                        <span className="text-[8px] font-black bg-black text-white px-2 py-0.5">LIT</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      <footer className="mt-20 bg-black py-16 px-8 text-center text-white border-t-8 border-[#d11a2a]">
        <p className="text-[10px] font-black uppercase tracking-[0.6em] text-[#d11a2a]">Industrial Performance Guaranteed // 2026</p>
      </footer>
    </div>
  );
}