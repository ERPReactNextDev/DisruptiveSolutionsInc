"use client";

import React, { useState, useEffect } from "react";
import { SmartImage } from "@/components/ui/smart-image";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { 
    collection, 
    onSnapshot, 
    query, 
    orderBy, 
    where, 
    QuerySnapshot, 
    DocumentData 
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Plus, 
    ImageIcon, 
    Check, 
    ChevronRight 
} from "lucide-react";

interface ApplicationProps {
    filteredProducts: any[];
    addToQuote: (product: any) => void;
    quoteCart: any[];
}

export default function ApplicationList({ filteredProducts, addToQuote, quoteCart }: ApplicationProps) {
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [openId, setOpenId] = useState<string | null>(null);

    useEffect(() => {
        const q = query(
            collection(db, "applications"),
            where("isActive", "==", true),
            orderBy("createdAt", "asc")
        );

        const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
            const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setApplications(list);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="space-y-4 p-6">
                {[1, 2, 3].map((n) => (
                    <div key={n} className="h-24 w-full bg-gray-50 animate-pulse rounded-2xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="border-t border-gray-100">
            {applications.map((app) => {
                const appProducts = filteredProducts.filter((product: any) => {
                    const targetAppTitle = app.title?.toUpperCase();
                    return product.dynamicSpecs?.some((spec: any) => 
                        spec.title?.toUpperCase() === "APPLICATION" && 
                        spec.value?.toUpperCase() === targetAppTitle
                    );
                });

                if (appProducts.length === 0) return null;

                const isOpen = openId === app.id;

                return (
                    <div 
                        key={app.id} 
                        className={`border-b border-gray-100 transition-all duration-300 ${isOpen ? 'bg-gray-50/50' : 'bg-white'}`}
                    >
                        {/* APPLICATION ROW HEADER */}
                        <button
                            onClick={() => setOpenId(isOpen ? null : app.id)}
                            className="w-full flex items-center justify-between p-5 md:p-8 transition-all text-left group"
                        >
                            <div className="flex items-center gap-6 md:gap-10 flex-1">
                                {/* LARGER APPLICATION IMAGE CONTAINER */}
                                <div className="w-28 h-18 md:w-48 md:h-28 bg-white shrink-0 overflow-hidden rounded-2xl border border-gray-100 shadow-sm relative transition-all group-hover:border-[#d11a2a]/30">
                                    {app.imageUrl ? (
                                        <SmartImage
                                            src={app.imageUrl}
                                            alt={app.title}
                                            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-50">
                                            <ImageIcon className="text-gray-300" size={24} />
                                        </div>
                                    )}
                                </div>

                                <div className="max-w-lg">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h4 className={`text-base md:text-xl font-black uppercase tracking-tight transition-colors group-hover:text-[#d11a2a] ${isOpen ? 'text-[#d11a2a]' : 'text-gray-900'}`}>
                                            {app.title}
                                        </h4>
                                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold shadow-sm transition-all border ${isOpen ? 'bg-[#d11a2a] text-white border-[#d11a2a]' : 'bg-gray-100 text-gray-500 border-gray-200 group-hover:bg-[#d11a2a] group-hover:text-white group-hover:border-[#d11a2a]'}`}>
                                            {appProducts.length}
                                        </span>
                                    </div>
                                    <p className="text-[11px] md:text-xs text-gray-600 font-semibold leading-tight line-clamp-2 uppercase tracking-wide italic max-w-md">
                                        {app.description || "Explore specialized lighting solutions for this application."}
                                    </p>
                                </div>
                            </div>

                            <div className={`p-3 rounded-full transition-all ${isOpen ? 'bg-[#d11a2a] text-white rotate-90' : 'bg-gray-50 text-gray-400 group-hover:text-gray-900'}`}>
                                <ChevronRight size={20} strokeWidth={3} />
                            </div>
                        </button>

                        {/* PRODUCT GRID SECTION */}
                        <AnimatePresence>
                            {isOpen && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                                    className="overflow-hidden"
                                >
                                    <div className="p-4 md:p-10 pt-0">
                                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-8">
                                            {appProducts.map((product: any) => {
                                                const isInCart = quoteCart.some((item: any) => item.id === product.id);
                                                const firstSpecGroup = product.technicalSpecs?.[0];

                                                return (
                                                    <div key={product.id} className="bg-white rounded-[32px] overflow-hidden border border-gray-100 hover:shadow-2xl hover:shadow-gray-300/50 transition-all duration-500 flex flex-col group/card relative">
                                                        <Link href={`/lighting-products-smart-solutions/${product.id}`}>
                                                            {/* LARGER PRODUCT IMAGE CONTAINER */}
                                                            <div className="relative h-60 sm:h-72 md:h-80 w-full bg-white p-6 flex items-center justify-center overflow-hidden">
                                                                <SmartImage 
                                                                    src={product.mainImage} 
                                                                    className="max-w-[95%] max-h-[95%] object-contain group-hover/card:scale-110 group-hover/card:blur-[2px] transition-all duration-700" 
                                                                    alt={product.name} 
                                                                />
                                                                
                                                                {/* Technical Specs Overlay */}
                                                                <motion.div 
                                                                    initial={{ opacity: 0 }} 
                                                                    whileHover={{ opacity: 1 }} 
                                                                    className="absolute inset-0 bg-black/85 backdrop-blur-[2px] flex flex-col justify-center items-center p-6 opacity-0 group-hover/card:opacity-100 transition-all duration-300 z-30"
                                                                >
                                                                    <p className="text-[10px] font-black text-[#d11a2a] uppercase tracking-widest mb-4 italic border-b border-[#d11a2a]/40 pb-1 w-full text-center">Technical Specs</p>
                                                                    <table className="w-full border-collapse">
                                                                        <tbody className="divide-y divide-white/10">
                                                                            {firstSpecGroup?.rows?.slice(0, 6).map((row: any, i: number) => (
                                                                                <tr key={i}>
                                                                                    <td className="py-2 text-[8px] md:text-[9px] font-bold text-gray-400 uppercase italic">{row.name}</td>
                                                                                    <td className="py-2 text-[9px] md:text-[10px] font-black text-white uppercase text-right">{row.value || "—"}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </motion.div>

                                                                <div className="absolute top-4 left-4 bg-white px-3 py-1.5 rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-tighter border border-gray-100 shadow-sm z-10">
                                                                    {product.sku}
                                                                </div>
                                                            </div>
                                                        </Link>
                                                        
                                                        <div className="p-5 md:p-6 flex flex-col flex-1 border-t border-gray-50 bg-white z-20">
                                                           <Link href={`/brand-lit/${product.slug}`} className="block group/link">
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
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                );
            })}
        </div>
    );
}