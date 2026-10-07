"use client";

import React, { useState, useEffect } from "react";
import { SmartImage } from "@/components/ui/smart-image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { ArrowLeft, Loader2, Plus, ShoppingBag, Search, SlidersHorizontal, X, Trash2, ArrowRight } from "lucide-react";

export default function ZumtobelHybridPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quoteCart, setQuoteCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false); // State para sa drawer

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Products");
  const categories = ["All Products", "Indoor", "Outdoor", "Emergency", "Controls", "Industrial"];

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
      where("brands", "array-contains", "ZUMTOBEL") 
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
      setIsCartOpen(true); // Buksan ang cart agad pag nag-add
    }
  };

  const removeFromCart = (productId: string) => {
    const updatedCart = quoteCart.filter(item => item.id !== productId);
    localStorage.setItem("disruptive_quote_cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  return (
    <div className="min-h-screen bg-white text-[#18181B] font-sans selection:bg-black selection:text-white relative">
      
      {/* --- MINIMALIST NAV --- */}
      <nav className="fixed top-0 w-full z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100 py-4 px-8">
        <div className="max-w-[1500px] mx-auto flex justify-between items-center">
          <Link href="/trusted-technology-brands" className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 hover:text-black flex items-center gap-2 transition-all">
            <ArrowLeft size={14} /> Back
          </Link>
          <div className="text-[10px] font-black uppercase tracking-[0.5em] text-black">Zumtobel Digital</div>
        </div>
      </nav>

      {/* --- FLOATING CART TRIGGER --- */}
      <div className="fixed bottom-8 right-8 z-50">
        <button 
          onClick={() => setIsCartOpen(true)}
          className="bg-black text-white p-5 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all group relative"
        >
          <ShoppingBag size={24} />
          {quoteCart.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#d11a2a] text-white text-[10px] w-6 h-6 flex items-center justify-center rounded-full font-black border-4 border-white">
              {quoteCart.length}
            </span>
          )}
        </button>
      </div>

      {/* --- SIDE CART DRAWER --- */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            />
            
            {/* Drawer */}
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full md:w-[450px] bg-white z-[70] shadow-2xl flex flex-col"
            >
              {/* Drawer Header */}
              <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tighter italic">Quote <span className="text-gray-300">Request.</span></h2>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{quoteCart.length} Items Selected</p>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-all">
                  <X size={20} />
                </button>
              </div>

              {/* Drawer Body (List) */}
              <div className="flex-grow overflow-y-auto p-8 space-y-6">
                {quoteCart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                      <ShoppingBag size={24} />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Your request list is empty.</p>
                  </div>
                ) : (
                  quoteCart.map((item) => (
                    <div key={item.id} className="flex gap-4 group">
                      <div className="w-20 h-20 bg-gray-50 border border-gray-100 flex-shrink-0 p-2">
                        <SmartImage src={item.mainImage} alt={item.name} className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-grow">
                        <h4 className="text-[11px] font-black uppercase leading-tight line-clamp-2">{item.name}</h4>
                        <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-widest">{item.sku}</p>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="mt-2 text-[8px] font-black text-gray-300 hover:text-red-600 flex items-center gap-1 transition-all uppercase tracking-tighter"
                        >
                          <Trash2 size={10} /> Remove
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-8 border-t border-gray-100 bg-gray-50/50">
                <Link 
                  href="/quote-request-form"
                  className={`w-full py-4 flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] transition-all ${
                    quoteCart.length > 0 
                    ? "bg-black text-white hover:bg-gray-800 shadow-xl shadow-black/10" 
                    : "bg-gray-200 text-gray-400 pointer-events-none"
                  }`}
                >
                  Proceed to Request <ArrowRight size={14} />
                </Link>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="w-full mt-4 text-[9px] font-bold text-gray-400 uppercase tracking-widest hover:text-black transition-all"
                >
                  Continue Browsing
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- HEADER --- */}
      <header className="pt-32 pb-16 px-8 max-w-[1500px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-gray-100 pb-12">
          <div className="space-y-2">
            <h1 className="text-5xl font-black uppercase tracking-tighter leading-none italic">
              Zumtobel <span className="text-gray-300">Solutions</span>
            </h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.5em]">Swiss Engineering • Precision Optics</p>
          </div>
          <div className="relative group w-full md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-black transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search model..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-6 py-3 bg-gray-50 border-none rounded-full text-xs font-medium focus:ring-1 focus:ring-black w-full transition-all outline-none"
            />
          </div>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="py-8 px-8 max-w-[1500px] mx-auto flex flex-col lg:flex-row gap-12">
        <aside className="w-full lg:w-64 flex-shrink-0 space-y-8">
          <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
            <SlidersHorizontal size={14} className="text-gray-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Filter</span>
          </div>
          <div className="space-y-4">
            <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">Collection</span>
            <div className="flex flex-col gap-1">
              {categories.map((cat) => (
                <button 
                  key={cat} 
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-left py-2 px-3 text-[11px] font-bold uppercase tracking-tight transition-all border-l-2 ${
                    selectedCategory === cat 
                    ? "border-black text-black bg-gray-50" 
                    : "border-transparent text-gray-400 hover:text-black hover:bg-gray-50"
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
            <div className="flex justify-center py-24"><Loader2 className="animate-spin text-gray-200" size={32} /></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-12">
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product) => (
                  <motion.div 
                    key={product.id} 
                    layout 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="group flex flex-col"
                  >
                    <div className="relative aspect-square border border-gray-200 bg-white overflow-hidden transition-all duration-300 group-hover:border-black group-hover:shadow-xl">
                      <div className="absolute inset-0 p-8 flex items-center justify-center group-hover:opacity-10 transition-all duration-500">
                        <SmartImage src={product.mainImage || "/placeholder.jpg"} alt={product.name} className="w-full h-full object-contain" />
                      </div>
                      
                      {/* Hover Table */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white overflow-y-auto">
                        <table className="w-full text-[9px] uppercase font-bold border-collapse">
                          <tbody>
                            {product.descriptionBlocks?.[0]?.value.split('\n').filter((l:any)=>l.trim()!=="").slice(0,6).map((line:string, i:number) => (
                              <tr key={i} className="border-b border-gray-100"><td className="p-2 text-gray-400">{line.split(':')[0]}</td><td className="p-2 text-black">{line.split(':')[1]}</td></tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <button 
                        onClick={() => addToQuote(product)}
                        className={`absolute bottom-3 right-3 w-10 h-10 flex items-center justify-center border z-20 transition-all ${
                          quoteCart.find(item => item.id === product.id)
                          ? "bg-black text-white border-black"
                          : "bg-white text-black border-gray-200 opacity-0 group-hover:opacity-100 hover:bg-black hover:text-white"
                        }`}
                      >
                        {quoteCart.find(item => item.id === product.id) ? "✓" : <Plus size={16} />}
                      </button>
                      <Link href={`/lighting-products-smart-solutions/${product.id}`} className="absolute inset-0 z-10" />
                    </div>
                    <div className="mt-5 px-1">
                      <h3 className="text-[12px] font-black uppercase tracking-tight text-black line-clamp-1">{product.name}</h3>
                      <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-widest">{product.sku || "N/A"}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      <footer className="py-20 border-t border-gray-50 text-center opacity-30 max-w-[1500px] mx-auto">
        <p className="text-[10px] font-black uppercase tracking-[0.8em]">Zumtobel × Disruptive Solutions</p>
      </footer>
    </div>
  );
}